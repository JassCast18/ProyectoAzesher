using Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Core.Hubs;

[AllowAnonymous]
public sealed class SaleScannerHub(ISaleScannerSessionService sessions) : Hub
{
    public async Task JoinSession(string token)
    {
        var session = sessions.Get(token) ?? throw new HubException("La sesión del lector no existe o ya venció.");
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(session.Token));
        await Clients.Caller.SendAsync("ScannerConnected", new { session.ExpiresAt });
    }

    public static string GroupName(string token) => $"sale-scanner:{token}";
}
