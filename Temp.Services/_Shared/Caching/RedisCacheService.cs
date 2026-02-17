using Microsoft.Extensions.Logging;

namespace Temp.Services.Caching;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _database;
    private readonly ILogger<RedisCacheService>? _logger;

    public RedisCacheService(IConnectionMultiplexer redis, ILogger<RedisCacheService>? logger = null) {
        _redis = redis;
        _database = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) {
        try {
            var value = await _database.StringGetAsync(key);

            if (value.IsNullOrEmpty)
                return default;

            return JsonConvert.DeserializeObject<T>(value!);
        } catch (RedisConnectionException ex) {
            _logger?.LogWarning(ex, "Redis connection failed for GetAsync with key: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, string? group = null, CancellationToken cancellationToken = default) {
        try {
            var serializedValue = JsonConvert.SerializeObject(value);
            await _database.StringSetAsync(key, serializedValue, expiration);

            if (!string.IsNullOrEmpty(group)) {
                 await _database.SetAddAsync($"group:{group}", key);
                 
                 if (expiration.HasValue) {
                     await _database.KeyExpireAsync($"group:{group}", expiration);
                 }
            }
        } catch (RedisConnectionException ex) {
            _logger?.LogWarning(ex, "Redis connection failed for SetAsync with key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default) {
        try {
            await _database.KeyDeleteAsync(key);
        } catch (RedisConnectionException ex) {
            _logger?.LogWarning(ex, "Redis connection failed for RemoveAsync with key: {Key}", key);
        }
    }

    public async Task RemoveGroupAsync(string group, CancellationToken cancellationToken = default) {
        try {
            var groupKey = $"group:{group}";
            var keys = await _database.SetMembersAsync(groupKey);

            if (keys.Length > 0) {
                 var redisKeys = keys.Select(k => (RedisKey)k.ToString()).ToArray();
                 await _database.KeyDeleteAsync(redisKeys);
            }
            
            await _database.KeyDeleteAsync(groupKey);
            
        } catch (RedisConnectionException ex) {
            _logger?.LogWarning(ex, "Redis connection failed for RemoveGroupAsync with group: {Group}", group);
        }
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default) {
        try {
            return await _database.KeyExistsAsync(key);
        } catch (RedisConnectionException ex) {
            _logger?.LogWarning(ex, "Redis connection failed for ExistsAsync with key: {Key}", key);
            return false;
        }
    }
}