using Temp.Database.UnitOfWork;
using Temp.Domain.Models.Identity;
using Temp.Services._Shared;
using Temp.Services.Auth.Exceptions;
using Temp.Services.Auth.Models.Commands;
using Temp.Services.Integrations.Loggings;
using Temp.Services.Providers;
using Temp.Services.Exceptions;

namespace Temp.Services.Auth;

public partial class AuthService : BaseService, IAuthService
{
    private readonly IConfiguration _config;
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;

    public AuthService(
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        IUnitOfWork unitOfWork,
        IConfiguration config,
        ILoggingBroker loggingBroker,
        IIdentityProvider identityProvider)
        : base(unitOfWork, null, loggingBroker, identityProvider) {
        _userManager = userManager;
        _signInManager = signInManager;
        _config = config;
    }

    public Task<LoginAppUserResponse> Login(LoginAppUserRequest request) =>
        TryCatch(async () => {
            var appUser = await _userManager.FindByEmailAsync(request.Username);
            
            // If user doesn't exist, return a failed result instead of throwing validation error
            if (appUser == null) {
                throw new AuthenticationException("Invalid username or password");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(appUser, request.Password, false);
            
            // Check if login failed
            if (!result.Succeeded) {
                throw new AuthenticationException("Invalid username or password");
            }

            var employeeId = await UnitOfWork.Employees
                .QueryNoTracking()
                .Where(x => x.AppUserId == appUser.Id)
                .Select(x => x.Id)
                .FirstOrDefaultAsync();

            await IdentityProvider.StoreCurrentUser(appUser.Id, appUser.Email);

            return new LoginAppUserResponse {
                User = new LoginAppUser {
                    Id = employeeId,
                    Username = appUser.DisplayName
                },
                Token = await GenerateToken(appUser)
            };
        });

    public async Task<bool> Logout() {
        await IdentityProvider.RemoveCurrentUser();

        return true;
    }

    public async Task<bool> CheckUsernameExists(string username) {
        return await _userManager.FindByEmailAsync(username) != null;
    }

    public Task<AppUser> Register(RegisterAppUserRequest request) =>
        TryCatch(async () => {

            if (!AppConstants.AllowedRoles.Contains(request.Role))
                throw new InvalidUserException($"Invalid role: {request.Role}. Allowed roles: {string.Join(", ", AppConstants.AllowedRoles)}");

            var user = new AppUser {
                DisplayName = request.DisplayName,
                Email = request.Email,
                UserName = request.Email,
                LockoutEnd = DateTimeOffset.MaxValue
            };

            ValidateUserOnCreate(user);

            var claims = new List<Claim>(){
               new Claim(ClaimTypes.Role, request.Role),
               new Claim(ClaimTypes.Name, user.DisplayName),
               new Claim(ClaimTypes.Email, user.Email)
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (result.Succeeded) {
                await _userManager.AddToRoleAsync(user, request.Role);
                await _userManager.AddClaimsAsync(user, claims);
                await UpdateEmployeeRole(request.Role, request.EmployeeId, user.Id);
            }

            return user;
        });

    public Task<AppUser> RemoveEmployeeRole(RemoveEmployeeRoleRequest request) =>
        TryCatch(async () => {
            var employee = await UnitOfWork.Employees.FirstOrDefaultAsync(x => x.Id == request.Id);
            ValidateUserIdIsNull(employee?.AppUserId);

            var appUser = await _userManager.FindByIdAsync(employee!.AppUserId!);
            ValidateUserIsNull(appUser);

            await _userManager.DeleteAsync(appUser);

            employee.AppUserId = null;
            employee.Role = "None";

            UnitOfWork.Employees.Update(employee);
            await UnitOfWork.SaveChangesAsync();

            return appUser;
        });

    public Task<AppUser> UpdateEmployeeAccountStatus(int employeeId) =>
        TryCatch(async () => {
            var employee = await UnitOfWork.Employees
                .FirstOrDefaultAsync(x => x.Id == employeeId);
            ValidateUserIdIsNull(employee.AppUserId);

            var appUser = await _userManager.FindByIdAsync(employee.AppUserId);
            ValidateUserIsNull(appUser);

            if (appUser.LockoutEnd != null) {
                appUser.LockoutEnd = null;
                employee.IsAppUserActive = true;
            } else {
                appUser.LockoutEnd = DateTimeOffset.MaxValue;
                employee.IsAppUserActive = false;
            }

            UnitOfWork.Employees.Update(employee);
            await UnitOfWork.SaveChangesAsync();

            return appUser;
        });

    private async Task<bool> UpdateEmployeeRole(string RoleName, int EmployeeId, string appUserId) {
        var employee = await UnitOfWork.Employees
            .FirstOrDefaultAsync(x => x.Id == EmployeeId);

        employee.Role = RoleName;
        employee.AppUserId = appUserId;
        employee.IsAppUserActive = false;

        UnitOfWork.Employees.Update(employee);
        await UnitOfWork.SaveChangesAsync();

        return employee.Role == RoleName;
    }

    private async Task<string> GenerateToken(AppUser appUser) {
        var appUserClaims = await _userManager.GetClaimsAsync(appUser);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config.GetSection("AppSettings:Token").Value));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(appUserClaims),
            Expires = DateTime.UtcNow.AddDays(1),
            SigningCredentials = creds,
            Issuer = _config["AppSettings:Issuer"],
            Audience = _config["AppSettings:Audience"] ?? _config["AppSettings:Issuer"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    public async Task<string> GetEmployeeUsername(int id) {

        var appUserId = await UnitOfWork.Employees
            .QueryNoTracking()
            .Where(x => x.Id == id)
            .Select(x => x.AppUserId)
            .FirstOrDefaultAsync();

        if (string.IsNullOrEmpty(appUserId))
            return string.Empty;

        var appUser = await _userManager.FindByIdAsync(appUserId);

        return appUser?.Email ?? string.Empty;
    }
}