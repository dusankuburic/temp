
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Temp.Database;
using Temp.Domain.Models;

namespace Temp.API.Data;

public static class Seed
{
    public static async Task SeedEntitiesAsync<TEntity>(
        ApplicationDbContext ctx,
        DbSet<TEntity> dbSet,
        string jsonFilePath) where TEntity : BaseEntity
    {
        if (await dbSet.AnyAsync())
        {
            return;
        }

        if (!File.Exists(jsonFilePath))
        {
            return;
        }

        var jsonData = await File.ReadAllTextAsync(jsonFilePath);
        var entities = JsonConvert.DeserializeObject<List<TEntity>>(jsonData);

        if (entities == null || !entities.Any())
        {
            return;
        }

        var now = DateTime.UtcNow;
        foreach (var entity in entities)
        {
            entity.CreatedAt = now;
            entity.CreatedBy = "System";
            entity.UpdatedAt = now;
            entity.UpdatedBy = "System";
        }

        await dbSet.AddRangeAsync(entities);
        await ctx.SaveChangesAsync();
    }

    public static async Task SeedOrganizationsAsync(ApplicationDbContext ctx)
    {
        await SeedEntitiesAsync(ctx, ctx.Organizations, "Data/OrganizationSeedData.json");
    }

    public static async Task SeedGroupsAsync(ApplicationDbContext ctx)
    {
        await SeedEntitiesAsync(ctx, ctx.Groups, "Data/GroupSeedData.json");
    }

    public static async Task SeedTeamsAsync(ApplicationDbContext ctx)
    {
        await SeedEntitiesAsync(ctx, ctx.Teams, "Data/TeamSeedData.json");
    }

    public static async Task SeedEmploymentStatusesAsync(ApplicationDbContext ctx)
    {
        await SeedEntitiesAsync(ctx, ctx.EmploymentStatuses, "Data/EmploymentStatusSeedData.json");
    }

    public static async Task SeedWorkplacesAsync(ApplicationDbContext ctx)
    {
        await SeedEntitiesAsync(ctx, ctx.Workplaces, "Data/WorkplaceSeedData.json");
    }

    public static async Task SeedEmployeesAsync(ApplicationDbContext ctx)
    {
        if (await ctx.Employees.AnyAsync())
        {
            return;
        }

        const string jsonFilePath = "Data/EmployeeSeedData.json";
        if (!File.Exists(jsonFilePath))
        {
            return;
        }

        var jsonData = await File.ReadAllTextAsync(jsonFilePath);
        var employees = JsonConvert.DeserializeObject<List<Employee>>(jsonData);

        if (employees == null || !employees.Any())
        {
            return;
        }

        var now = DateTime.UtcNow;
        foreach (var employee in employees)
        {
            employee.CreatedAt = now;
            employee.CreatedBy = "System";
            employee.UpdatedAt = now;
            employee.UpdatedBy = "System";

            if (string.IsNullOrWhiteSpace(employee.AppUserId))
            {
                employee.AppUserId = Guid.NewGuid().ToString();
            }
        }

        await ctx.Employees.AddRangeAsync(employees);
        await ctx.SaveChangesAsync();
    }
}