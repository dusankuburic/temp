using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Temp.API.Bootstrap;
using Temp.API.Middleware;
using Temp.API.Services;
using Temp.Database;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureLogging();
builder.Services.AddMappingsCollection();
builder.Services.ConfigurePersistence(builder.Configuration);
builder.Services.AddProgramServices(builder.Configuration);
builder.Services.AddAuthSetup(builder.Configuration);
builder.Services.AddDataSeeder(builder.Configuration);
builder.Services.ConfigureSwaggerDoc();
builder.Services.AddControllers()
    .ConfigureSerialization()
    .ConfigureFluentValidation();
builder.Services.AddHealthChecks();
builder.Services.AddDataProtection();
builder.Services.ConfigureCORS();
builder.Services.AddRateLimitingConfiguration();
builder.Services.AddResponseCompression(options => {
    options.EnableForHttps = true;
});
var app = builder.Build();


using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        var ctx = services.GetRequiredService<ApplicationDbContext>();

        const int maxRetries = 5;
        int retryCount = 0;
        bool success = false;

        while (retryCount < maxRetries && !success)
        {
            try
            {
                bool databaseExists = await ctx.Database.CanConnectAsync();

                if (!databaseExists)
                {
                    await ctx.Database.EnsureCreatedAsync();
                    logger.LogInformation("Database created successfully from model");
                }
                else
                {
                    await ctx.Database.MigrateAsync();
                    logger.LogInformation("Database migrations applied successfully");
                }

                success = true;
            }
            catch (Exception ex)
            {
                retryCount++;
                if (retryCount >= maxRetries)
                {
                    logger.LogError(ex, "Failed to initialize database after {RetryCount} attempts", maxRetries);
                    throw;
                }

                logger.LogWarning(ex, "Database initialization attempt {RetryCount} failed. Retrying in 2 seconds...", retryCount);
                await Task.Delay(2000);
            }
        }

        var seeder = services.GetRequiredService<IDataSeeder>();
        await seeder.SeedAsync();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error during application initialization");
    }
}
app.UseHttpLogging();
app.UseResponseCompression();
app.UseMiddleware<ExceptionMiddleware>();
app.UseSwaggerDoc();
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("CorsPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health", new HealthCheckOptions {
    AllowCachingResponses = false,
    ResultStatusCodes = {
        [HealthStatus.Healthy] = StatusCodes.Status200OK,
        [HealthStatus.Degraded] = StatusCodes.Status200OK,
        [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
    }
});
app.MapControllers();

app.Run();


public partial class Program { }