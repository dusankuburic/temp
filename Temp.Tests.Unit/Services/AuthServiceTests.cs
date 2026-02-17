using System.Linq.Expressions;
using System.Security.Claims;
using AutoFixture;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using MockQueryable.Moq;
using Moq;
using Temp.Database.Repositories;
using Temp.Database.UnitOfWork;
using Temp.Domain.Models;
using Temp.Domain.Models.Identity;
using Temp.Services.Auth;
using Temp.Services.Auth.Exceptions;
using Temp.Services.Auth.Models.Commands;
using Temp.Services.Exceptions;
using Temp.Services.Integrations.Loggings;
using Temp.Services.Providers;
using Temp.Services.Providers.Models;

namespace Temp.Tests.Unit.Services;

public class AuthServiceTests
{
    private readonly Mock<UserManager<AppUser>> _mockUserManager;
    private readonly Mock<SignInManager<AppUser>> _mockSignInManager;
    private readonly Mock<IUnitOfWork> _mockUnitOfWork;
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly Mock<ILoggingBroker> _mockLoggingBroker;
    private readonly Mock<IIdentityProvider> _mockIdentityProvider;
    private readonly Mock<IRepository<Employee>> _mockEmployeeRepository;
    private readonly IFixture _fixture;
    private readonly IAuthService _service;

    public AuthServiceTests() {

        var userStore = new Mock<IUserStore<AppUser>>();
        _mockUserManager = new Mock<UserManager<AppUser>>(
            userStore.Object, null, null, null, null, null, null, null, null);


        var contextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<AppUser>>();
        _mockSignInManager = new Mock<SignInManager<AppUser>>(
            _mockUserManager.Object, contextAccessor.Object, claimsFactory.Object, null, null, null, null);

        _mockUnitOfWork = new Mock<IUnitOfWork>();
        _mockConfig = new Mock<IConfiguration>();
        _mockLoggingBroker = new Mock<ILoggingBroker>();
        _mockIdentityProvider = new Mock<IIdentityProvider>();
        _mockEmployeeRepository = new Mock<IRepository<Employee>>();

        _fixture = new Fixture();
        _fixture.Behaviors.OfType<ThrowingRecursionBehavior>().ToList()
            .ForEach(b => _fixture.Behaviors.Remove(b));
        _fixture.Behaviors.Add(new OmitOnRecursionBehavior());


        _mockUnitOfWork.Setup(uow => uow.Employees).Returns(_mockEmployeeRepository.Object);


        var configSection = new Mock<IConfigurationSection>();
        configSection.Setup(s => s.Value).Returns("super-secret-key-for-testing-that-is-at-least-512-bits-long-for-hmac-sha512");
        _mockConfig.Setup(c => c.GetSection("AppSettings:Token")).Returns(configSection.Object);
        _mockConfig.Setup(c => c["AppSettings:Issuer"]).Returns("TestIssuer");
        _mockConfig.Setup(c => c["AppSettings:Audience"]).Returns("TestAudience");

        _service = new AuthService(
            _mockUserManager.Object,
            _mockSignInManager.Object,
            _mockUnitOfWork.Object,
            _mockConfig.Object,
            _mockLoggingBroker.Object,
            _mockIdentityProvider.Object);
    }



    [Fact]
    public async Task Login_WithValidCredentials_ReturnsTokenAndUser() {

        var request = new LoginAppUserRequest {
            Username = "test@example.com",
            Password = "ValidPassword123!"
        };

        var appUser = new AppUser {
            Id = "user-123",
            Email = "test@example.com",
            DisplayName = "Test User"
        };

        var employeeId = 1;
        var employees = new List<Employee> {
            new Employee { Id = employeeId, AppUserId = "user-123" }
        }.AsQueryable().BuildMockDbSet().Object;

        _mockUserManager.Setup(m => m.FindByEmailAsync(request.Username))
            .ReturnsAsync(appUser);

        _mockSignInManager.Setup(m => m.CheckPasswordSignInAsync(appUser, request.Password, false))
            .ReturnsAsync(SignInResult.Success);

        _mockEmployeeRepository.Setup(r => r.QueryNoTracking())
            .Returns(employees);

        _mockIdentityProvider.Setup(i => i.StoreCurrentUser(appUser.Id, appUser.Email))
            .ReturnsAsync(true);

        _mockUserManager.Setup(m => m.GetClaimsAsync(appUser))
            .ReturnsAsync(new List<Claim> {
                new Claim(ClaimTypes.Email, appUser.Email),
                new Claim(ClaimTypes.Name, appUser.DisplayName)
            });


        var result = await _service.Login(request);


        result.Should().NotBeNull();
        result.Token.Should().NotBeNullOrEmpty();
        result.User.Should().NotBeNull();
        result.User.Id.Should().Be(employeeId);
        result.User.Username.Should().Be(appUser.DisplayName);
    }

    [Fact]
    public async Task Login_WithNonExistentUser_ThrowsUserValidationException() {

        var request = new LoginAppUserRequest {
            Username = "nonexistent@example.com",
            Password = "Password123!"
        };

        _mockUserManager.Setup(m => m.FindByEmailAsync(request.Username))
            .ReturnsAsync((AppUser)null);


        Func<Task> act = () => _service.Login(request);


        await act.Should().ThrowAsync<AuthenticationException>();
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ThrowsAuthenticationException() {

        var request = new LoginAppUserRequest {
            Username = "test@example.com",
            Password = "WrongPassword!"
        };

        var appUser = new AppUser {
            Id = "user-123",
            Email = "test@example.com"
        };

        _mockUserManager.Setup(m => m.FindByEmailAsync(request.Username))
            .ReturnsAsync(appUser);

        _mockSignInManager.Setup(m => m.CheckPasswordSignInAsync(appUser, request.Password, false))
            .ReturnsAsync(SignInResult.Failed);


        Func<Task> act = () => _service.Login(request);


        await act.Should().ThrowAsync<AuthenticationException>();
    }

    [Fact]
    public async Task Login_WithLockedOutUser_ThrowsAuthenticationException() {

        var request = new LoginAppUserRequest {
            Username = "locked@example.com",
            Password = "Password123!"
        };

        var appUser = new AppUser {
            Id = "user-123",
            Email = "locked@example.com",
            LockoutEnd = DateTimeOffset.MaxValue
        };

        _mockUserManager.Setup(m => m.FindByEmailAsync(request.Username))
            .ReturnsAsync(appUser);

        _mockSignInManager.Setup(m => m.CheckPasswordSignInAsync(appUser, request.Password, false))
            .ReturnsAsync(SignInResult.LockedOut);


        Func<Task> act = () => _service.Login(request);


        await act.Should().ThrowAsync<AuthenticationException>();
    }





    [Fact]
    public async Task Logout_RemovesCurrentUser_ReturnsTrue() {

        _mockIdentityProvider.Setup(i => i.RemoveCurrentUser())
            .ReturnsAsync(true);


        var result = await _service.Logout();


        result.Should().BeTrue();
        _mockIdentityProvider.Verify(i => i.RemoveCurrentUser(), Times.Once);
    }





    [Fact]
    public async Task CheckUsernameExists_WithExistingUsername_ReturnsTrue() {

        var username = "existing@example.com";
        var appUser = new AppUser { Email = username };

        _mockUserManager.Setup(m => m.FindByEmailAsync(username))
            .ReturnsAsync(appUser);


        var result = await _service.CheckUsernameExists(username);


        result.Should().BeTrue();
    }

    [Fact]
    public async Task CheckUsernameExists_WithNonExistingUsername_ReturnsFalse() {

        var username = "nonexistent@example.com";

        _mockUserManager.Setup(m => m.FindByEmailAsync(username))
            .ReturnsAsync((AppUser)null);


        var result = await _service.CheckUsernameExists(username);


        result.Should().BeFalse();
    }





    [Fact]
    public async Task Register_WithValidData_CreatesUser() {

        var request = new RegisterAppUserRequest {
            EmployeeId = 1,
            DisplayName = "New User",
            Role = "User",
            Email = "newuser@example.com",
            Password = "ValidPassword123!"
        };

        var employee = new Employee { Id = request.EmployeeId };

        _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<AppUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        _mockUserManager.Setup(m => m.AddToRoleAsync(It.IsAny<AppUser>(), request.Role))
            .ReturnsAsync(IdentityResult.Success);

        _mockUserManager.Setup(m => m.AddClaimsAsync(It.IsAny<AppUser>(), It.IsAny<IEnumerable<Claim>>()))
            .ReturnsAsync(IdentityResult.Success);

        _mockEmployeeRepository.Setup(r => r.FirstOrDefaultAsync(
            It.IsAny<Expression<Func<Employee, bool>>>(), default))
            .ReturnsAsync(employee);

        _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync(default))
            .ReturnsAsync(1);


        var result = await _service.Register(request);


        result.Should().NotBeNull();
        result.Email.Should().Be(request.Email);
        result.DisplayName.Should().Be(request.DisplayName);
    }

    [Fact]
    public async Task Register_WithInvalidRole_ThrowsUserValidationException() {

        var request = new RegisterAppUserRequest {
            EmployeeId = 1,
            DisplayName = "Hacker",
            Role = "SuperAdmin",
            Email = "hacker@example.com",
            Password = "Password123!"
        };


        Func<Task> act = () => _service.Register(request);


        await act.Should().ThrowAsync<UserValidationException>();
    }

    [Theory]
    [InlineData("Admin")]
    [InlineData("User")]
    [InlineData("Moderator")]
    public async Task Register_WithAllowedRoles_Succeeds(string role) {

        var request = new RegisterAppUserRequest {
            EmployeeId = 1,
            DisplayName = "Test User",
            Role = role,
            Email = "test@example.com",
            Password = "ValidPassword123!"
        };

        var employee = new Employee { Id = request.EmployeeId };

        _mockUserManager.Setup(m => m.CreateAsync(It.IsAny<AppUser>(), request.Password))
            .ReturnsAsync(IdentityResult.Success);

        _mockUserManager.Setup(m => m.AddToRoleAsync(It.IsAny<AppUser>(), request.Role))
            .ReturnsAsync(IdentityResult.Success);

        _mockUserManager.Setup(m => m.AddClaimsAsync(It.IsAny<AppUser>(), It.IsAny<IEnumerable<Claim>>()))
            .ReturnsAsync(IdentityResult.Success);

        _mockEmployeeRepository.Setup(r => r.FirstOrDefaultAsync(
            It.IsAny<Expression<Func<Employee, bool>>>(), default))
            .ReturnsAsync(employee);

        _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync(default))
            .ReturnsAsync(1);


        var result = await _service.Register(request);


        result.Should().NotBeNull();
    }

    [Fact]
    public async Task Register_WithEmptyDisplayName_ThrowsUserValidationException() {

        var request = new RegisterAppUserRequest {
            EmployeeId = 1,
            DisplayName = "",
            Role = "User",
            Email = "test@example.com",
            Password = "ValidPassword123!"
        };


        Func<Task> act = () => _service.Register(request);


        await act.Should().ThrowAsync<UserValidationException>();
    }

    [Fact]
    public async Task Register_WithEmptyEmail_ThrowsUserValidationException() {

        var request = new RegisterAppUserRequest {
            EmployeeId = 1,
            DisplayName = "Test User",
            Role = "User",
            Email = "",
            Password = "ValidPassword123!"
        };


        Func<Task> act = () => _service.Register(request);


        await act.Should().ThrowAsync<UserValidationException>();
    }





    [Fact]
    public async Task RemoveEmployeeRole_WithValidEmployee_RemovesRoleAndUpdatesEmployee() {

        var request = new RemoveEmployeeRoleRequest { Id = 1 };
        var employee = new Employee {
            Id = 1,
            AppUserId = "user-123",
            Role = "User"
        };
        var appUser = new AppUser {
            Id = "user-123",
            Email = "test@example.com"
        };

        _mockEmployeeRepository.Setup(r => r.FirstOrDefaultAsync(
            It.IsAny<Expression<Func<Employee, bool>>>(), default))
            .ReturnsAsync(employee);

        _mockUserManager.Setup(m => m.FindByIdAsync("user-123"))
            .ReturnsAsync(appUser);

        _mockUserManager.Setup(m => m.DeleteAsync(appUser))
            .ReturnsAsync(IdentityResult.Success);

        _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync(default))
            .ReturnsAsync(1);


        var result = await _service.RemoveEmployeeRole(request);


        result.Should().NotBeNull();
        _mockUserManager.Verify(m => m.DeleteAsync(appUser), Times.Once);
        _mockEmployeeRepository.Verify(r => r.Update(It.Is<Employee>(e =>
            e.AppUserId == null && e.Role == "None")), Times.Once);
    }

    [Fact]
    public async Task RemoveEmployeeRole_WithEmployeeWithoutAppUser_ThrowsUserValidationException() {

        var request = new RemoveEmployeeRoleRequest { Id = 1 };
        var employee = new Employee {
            Id = 1,
            AppUserId = null,
            Role = "None"
        };

        _mockEmployeeRepository.Setup(r => r.FirstOrDefaultAsync(
            It.IsAny<Expression<Func<Employee, bool>>>(), default))
            .ReturnsAsync(employee);


        Func<Task> act = () => _service.RemoveEmployeeRole(request);


        await act.Should().ThrowAsync<UserValidationException>();
    }





    [Fact]
    public async Task UpdateEmployeeAccountStatus_WhenLocked_UnlocksUser() {

        var employeeId = 1;
        var employee = new Employee {
            Id = employeeId,
            AppUserId = "user-123",
            IsAppUserActive = false
        };
        var appUser = new AppUser {
            Id = "user-123",
            LockoutEnd = DateTimeOffset.MaxValue
        };

        _mockEmployeeRepository.Setup(r => r.FirstOrDefaultAsync(
            It.IsAny<Expression<Func<Employee, bool>>>(), default))
            .ReturnsAsync(employee);

        _mockUserManager.Setup(m => m.FindByIdAsync("user-123"))
            .ReturnsAsync(appUser);

        _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync(default))
            .ReturnsAsync(1);


        var result = await _service.UpdateEmployeeAccountStatus(employeeId);


        result.Should().NotBeNull();
        result.LockoutEnd.Should().BeNull();
    }

    [Fact]
    public async Task UpdateEmployeeAccountStatus_WhenUnlocked_LocksUser() {

        var employeeId = 1;
        var employee = new Employee {
            Id = employeeId,
            AppUserId = "user-123",
            IsAppUserActive = true
        };
        var appUser = new AppUser {
            Id = "user-123",
            LockoutEnd = null
        };

        _mockEmployeeRepository.Setup(r => r.FirstOrDefaultAsync(
            It.IsAny<Expression<Func<Employee, bool>>>(), default))
            .ReturnsAsync(employee);

        _mockUserManager.Setup(m => m.FindByIdAsync("user-123"))
            .ReturnsAsync(appUser);

        _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync(default))
            .ReturnsAsync(1);


        var result = await _service.UpdateEmployeeAccountStatus(employeeId);


        result.Should().NotBeNull();
        result.LockoutEnd.Should().Be(DateTimeOffset.MaxValue);
    }

    [Fact]
    public async Task UpdateEmployeeAccountStatus_WithEmployeeWithoutAppUser_ThrowsUserValidationException() {

        var employeeId = 1;
        var employee = new Employee {
            Id = employeeId,
            AppUserId = null
        };

        _mockEmployeeRepository.Setup(r => r.FirstOrDefaultAsync(
            It.IsAny<Expression<Func<Employee, bool>>>(), default))
            .ReturnsAsync(employee);


        Func<Task> act = () => _service.UpdateEmployeeAccountStatus(employeeId);


        await act.Should().ThrowAsync<UserValidationException>();
    }





    [Fact]
    public async Task GetEmployeeUsername_WithValidEmployee_ReturnsUsername() {

        var employeeId = 1;
        var appUserId = "user-123";
        var email = "test@example.com";

        var employees = new List<Employee> {
            new Employee { Id = employeeId, AppUserId = appUserId }
        }.AsQueryable().BuildMockDbSet().Object;

        _mockEmployeeRepository.Setup(r => r.QueryNoTracking())
            .Returns(employees);

        _mockUserManager.Setup(m => m.FindByIdAsync(appUserId))
            .ReturnsAsync(new AppUser { Id = appUserId, Email = email });


        var result = await _service.GetEmployeeUsername(employeeId);


        result.Should().Be(email);
    }

    [Fact]
    public async Task GetEmployeeUsername_WithEmployeeWithoutAppUser_ReturnsEmptyString() {

        var employeeId = 1;

        var employees = new List<Employee> {
            new Employee { Id = employeeId, AppUserId = null }
        }.AsQueryable().BuildMockDbSet().Object;

        _mockEmployeeRepository.Setup(r => r.QueryNoTracking())
            .Returns(employees);


        var result = await _service.GetEmployeeUsername(employeeId);


        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetEmployeeUsername_WithNonExistentEmployee_ReturnsEmptyString() {

        var employeeId = 999;

        var employees = new List<Employee>().AsQueryable().BuildMockDbSet().Object;

        _mockEmployeeRepository.Setup(r => r.QueryNoTracking())
            .Returns(employees);


        var result = await _service.GetEmployeeUsername(employeeId);


        result.Should().BeEmpty();
    }





    [Theory]
    [InlineData("Root")]
    [InlineData("SuperAdmin")]
    [InlineData("SystemAdmin")]
    [InlineData("")]
    [InlineData("  ")]
    public async Task Register_WithUnauthorizedRole_ThrowsUserValidationException(string invalidRole) {

        var request = new RegisterAppUserRequest {
            EmployeeId = 1,
            DisplayName = "Test User",
            Role = invalidRole,
            Email = "test@example.com",
            Password = "ValidPassword123!"
        };


        Func<Task> act = () => _service.Register(request);


        await act.Should().ThrowAsync<UserValidationException>();
    }

    [Fact]
    public async Task Login_StoresUserInIdentityProvider() {

        var request = new LoginAppUserRequest {
            Username = "test@example.com",
            Password = "ValidPassword123!"
        };

        var appUser = new AppUser {
            Id = "user-123",
            Email = "test@example.com",
            DisplayName = "Test User"
        };

        var employees = new List<Employee> {
            new Employee { Id = 1, AppUserId = "user-123" }
        }.AsQueryable().BuildMockDbSet().Object;

        _mockUserManager.Setup(m => m.FindByEmailAsync(request.Username))
            .ReturnsAsync(appUser);

        _mockSignInManager.Setup(m => m.CheckPasswordSignInAsync(appUser, request.Password, false))
            .ReturnsAsync(SignInResult.Success);

        _mockEmployeeRepository.Setup(r => r.QueryNoTracking())
            .Returns(employees);

        _mockIdentityProvider.Setup(i => i.StoreCurrentUser(appUser.Id, appUser.Email))
            .ReturnsAsync(true);

        _mockUserManager.Setup(m => m.GetClaimsAsync(appUser))
            .ReturnsAsync(new List<Claim>());


        await _service.Login(request);


        _mockIdentityProvider.Verify(i => i.StoreCurrentUser(appUser.Id, appUser.Email), Times.Once);
    }





    [Fact]
    public async Task Login_WithNonExistentUser_LogsError() {

        var request = new LoginAppUserRequest {
            Username = "nonexistent@example.com",
            Password = "Password123!"
        };

        _mockUserManager.Setup(m => m.FindByEmailAsync(request.Username))
            .ReturnsAsync((AppUser)null);


        try {
            await _service.Login(request);
        } catch (AuthenticationException) {

        }


        _mockLoggingBroker.Verify(l => l.LogError(It.IsAny<Exception>()), Times.Never);
    }

    [Fact]
    public async Task Register_WithInvalidRole_LogsError() {

        var request = new RegisterAppUserRequest {
            EmployeeId = 1,
            DisplayName = "Test",
            Role = "InvalidRole",
            Email = "test@example.com",
            Password = "Password123!"
        };


        try {
            await _service.Register(request);
        } catch (UserValidationException) {

        }


        _mockLoggingBroker.Verify(l => l.LogError(It.IsAny<Exception>()), Times.Once);
    }





    [Fact]
    public void Constructor_WithValidDependencies_CreatesInstance() {

        var service = new AuthService(
            _mockUserManager.Object,
            _mockSignInManager.Object,
            _mockUnitOfWork.Object,
            _mockConfig.Object,
            _mockLoggingBroker.Object,
            _mockIdentityProvider.Object);


        service.Should().NotBeNull();
    }


}