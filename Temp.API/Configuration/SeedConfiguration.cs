namespace Temp.API.Configuration;

public class SeedConfiguration
{
    public const string SectionName = "SeedConfiguration";

    public bool SeedData { get; set; } = true;
    public AdminUserConfiguration AdminUser { get; set; } = new();
}

public class AdminUserConfiguration
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public int? EmployeeId { get; set; }
}
