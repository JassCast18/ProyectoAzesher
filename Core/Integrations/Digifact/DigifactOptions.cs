namespace Core.Integrations.Digifact;

public sealed class DigifactOptions
{
    public const string SectionName = "Digifact";
    public bool Enabled { get; set; }
    public string Environment { get; set; } = "Test";
    public string BaseUrl { get; set; } = "https://testnucgt.digifact.com/api/";
    public string TaxId { get; set; } = "";
    public string Username { get; set; } = "TESTUSER";
    public string Password { get; set; } = "";
    public string SellerName { get; set; } = "";
    public string VatAffiliation { get; set; } = "GEN";
    public string Email { get; set; } = "";
    public string BranchCode { get; set; } = "1";
    public string BranchName { get; set; } = "";
    public string BranchAddress { get; set; } = "";
    public string BranchCity { get; set; } = "01010";
    public string BranchDistrict { get; set; } = "Guatemala";
    public string BranchState { get; set; } = "Guatemala";
    public string PersonType { get; set; } = "0";
    public string PhraseType { get; set; } = "1";
    public string PhraseScenario { get; set; } = "1";
    public List<DigifactBranchOptions> Branches { get; set; } = [];

    public string NormalizedTaxId => NormalizeTaxId(TaxId).PadLeft(12, '0');
    public string LoginUsername => Username.StartsWith("GT.", StringComparison.OrdinalIgnoreCase)
        ? Username
        : $"GT.{NormalizedTaxId}.{Username}";

    public bool HasCredentials => Enabled && !string.IsNullOrWhiteSpace(TaxId) &&
        !string.IsNullOrWhiteSpace(Username) && !string.IsNullOrWhiteSpace(Password);

    public static string NormalizeTaxId(string? value) =>
        new((value ?? "").Trim().ToUpperInvariant().Where(char.IsLetterOrDigit).ToArray());
}

public sealed class DigifactBranchOptions
{
    public string MatchName { get; set; } = "";
    public string Code { get; set; } = "1";
    public string Name { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "01010";
    public string District { get; set; } = "Guatemala";
    public string State { get; set; } = "Guatemala";
}
