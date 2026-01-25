using Temp.API.Configuration;
using Temp.API.Services;

namespace Temp.API.Bootstrap;

public static class ProgramDataSeederSetup
{
    public static IServiceCollection AddDataSeeder(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SeedConfiguration>(configuration.GetSection(SeedConfiguration.SectionName));
        services.AddScoped<IDataSeeder, DataSeeder>();

        return services;
    }
}
