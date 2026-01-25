using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Temp.API.Configuration;
using Temp.API.Data;
using Temp.Database;
using Temp.Domain.Models.Identity;

namespace Temp.API.Services;

public class DataSeeder : IDataSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ILogger<DataSeeder> _logger;
    private readonly SeedConfiguration _seedConfig;

    public DataSeeder(
        ApplicationDbContext context,
        UserManager<AppUser> userManager,
        RoleManager<IdentityRole> roleManager,
        ILogger<DataSeeder> logger,
        IOptions<SeedConfiguration> seedConfig)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _logger = logger;
        _seedConfig = seedConfig.Value;
    }

    public async Task SeedAsync()
    {
        if (!_seedConfig.SeedData)
        {
            _logger.LogInformation("Data seeding is disabled in configuration");
            return;
        }

        try
        {
            _logger.LogInformation("Starting database seeding");

            await SeedRolesAsync();
            await SeedEntitiesAsync();
            await SeedAdminUserAsync();

            _logger.LogInformation("Database seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database");
            throw;
        }
    }

    private async Task SeedRolesAsync()
    {
        var roles = new[] { "Admin", "User", "Moderator" };

        foreach (var roleName in roles)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                _logger.LogInformation("Creating role: {RoleName}", roleName);
                var result = await _roleManager.CreateAsync(new IdentityRole { Name = roleName });

                if (!result.Succeeded)
                {
                    _logger.LogWarning("Failed to create role {RoleName}: {Errors}",
                        roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }
    }

    private async Task SeedEntitiesAsync()
    {
        _logger.LogInformation("Seeding domain entities");

        await Seed.SeedOrganizationsAsync(_context);
        await Seed.SeedGroupsAsync(_context);
        await Seed.SeedTeamsAsync(_context);
        await Seed.SeedEmploymentStatusesAsync(_context);
        await Seed.SeedWorkplacesAsync(_context);
        await Seed.SeedEmployeesAsync(_context);

        _logger.LogInformation("Domain entities seeded successfully");
    }

    private async Task SeedAdminUserAsync()
    {
        if (await _userManager.Users.AnyAsync())
        {
            _logger.LogInformation("Users already exist, skipping admin user creation");
            return;
        }

        var adminConfig = _seedConfig.AdminUser;

        if (string.IsNullOrWhiteSpace(adminConfig.Email) ||
            string.IsNullOrWhiteSpace(adminConfig.Password))
        {
            _logger.LogWarning("Admin user configuration is incomplete, skipping admin user creation");
            return;
        }

        _logger.LogInformation("Creating admin user: {Email}", adminConfig.Email);

        var adminUser = new AppUser
        {
            DisplayName = adminConfig.DisplayName,
            Email = adminConfig.Email,
            UserName = adminConfig.Email,
            LockoutEnabled = false,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(adminUser, adminConfig.Password);

        if (!result.Succeeded)
        {
            _logger.LogError("Failed to create admin user: {Errors}",
                string.Join(", ", result.Errors.Select(e => e.Description)));
            return;
        }

        await _userManager.AddToRoleAsync(adminUser, "Admin");

        var claims = new List<Claim>
        {
            new(ClaimTypes.Role, "Admin"),
            new(ClaimTypes.Email, adminUser.Email),
            new(ClaimTypes.Name, adminUser.DisplayName)
        };

        await _userManager.AddClaimsAsync(adminUser, claims);

        if (adminConfig.EmployeeId.HasValue)
        {
            await LinkAdminToEmployeeAsync(adminUser.Id, adminConfig.EmployeeId.Value);
        }

        _logger.LogInformation("Admin user created successfully");
    }

    private async Task LinkAdminToEmployeeAsync(string userId, int employeeId)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(x => x.Id == employeeId);

        if (employee == null)
        {
            _logger.LogWarning("Employee with ID {EmployeeId} not found, cannot link to admin user", employeeId);
            return;
        }

        employee.AppUserId = userId;
        employee.IsAppUserActive = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin user linked to employee ID {EmployeeId}", employeeId);
    }
}
