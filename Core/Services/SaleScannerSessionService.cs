using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace Core.Services;

public sealed class SaleScannerSession
{
    private readonly object scanLock = new();
    private string lastCode = string.Empty;
    private DateTimeOffset lastScanAt = DateTimeOffset.MinValue;

    public required string Token { get; init; }
    public required int UserId { get; init; }
    public required int BranchId { get; init; }
    public required DateTimeOffset ExpiresAt { get; init; }

    public bool TryAccept(string code)
    {
        lock (scanLock)
        {
            var now = DateTimeOffset.UtcNow;
            if (string.Equals(lastCode, code, StringComparison.OrdinalIgnoreCase) && now - lastScanAt < TimeSpan.FromMilliseconds(900))
                return false;
            lastCode = code;
            lastScanAt = now;
            return true;
        }
    }
}

public interface ISaleScannerSessionService
{
    SaleScannerSession Create(int userId, int branchId);
    SaleScannerSession? Get(string token);
    bool Close(string token, int userId);
}

public sealed class SaleScannerSessionService : ISaleScannerSessionService
{
    private readonly ConcurrentDictionary<string, SaleScannerSession> sessions = new(StringComparer.Ordinal);

    public SaleScannerSession Create(int userId, int branchId)
    {
        Cleanup();
        var session = new SaleScannerSession
        {
            Token = Convert.ToHexString(RandomNumberGenerator.GetBytes(24)).ToLowerInvariant(),
            UserId = userId,
            BranchId = branchId,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(30)
        };
        sessions[session.Token] = session;
        return session;
    }

    public SaleScannerSession? Get(string token)
    {
        if (string.IsNullOrWhiteSpace(token) || !sessions.TryGetValue(token, out var session)) return null;
        if (session.ExpiresAt > DateTimeOffset.UtcNow) return session;
        sessions.TryRemove(token, out _);
        return null;
    }

    public bool Close(string token, int userId)
    {
        var session = Get(token);
        return session is not null && session.UserId == userId && sessions.TryRemove(token, out _);
    }

    private void Cleanup()
    {
        foreach (var item in sessions.Where(item => item.Value.ExpiresAt <= DateTimeOffset.UtcNow))
            sessions.TryRemove(item.Key, out _);
    }
}
