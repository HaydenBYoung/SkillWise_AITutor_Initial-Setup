const { execSync } = require('child_process');
const path = require('path');

console.log('Running endpoint tests...\n');

const command = `
$ErrorActionPreference = 'Continue';
Write-Output 'Attempting registration...';
try {
    $reg = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/register' -Method Post -ContentType 'application/json' -Body (ConvertTo-Json @{
        firstName='Auto4'
        lastName='Tester'
        email='autotest4@example.com'
        password='Password123'
        confirmPassword='Password123'
    });
    Write-Output 'REGISTER OK';
    $reg | ConvertTo-Json -Depth 5 | Write-Output
} catch {
    Write-Output 'REGISTER ERROR';
    if ($_.Exception.Response) {
        $_.Exception.Response.StatusCode.Value__ | Write-Output;
        $_.Exception.Response.GetResponseStream() | % { new-object System.IO.StreamReader($_) } | % { $_.ReadToEnd() } | Write-Output
    } else {
        $_ | Format-List | Out-String | Write-Output
    }
};

Start-Sleep -Seconds 1;

Write-Output 'Attempting login...';
try {
    $login = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -ContentType 'application/json' -Body (ConvertTo-Json @{
        email='autotest4@example.com'
        password='Password123'
    });
    Write-Output 'LOGIN OK';
    $login | ConvertTo-Json -Depth 5 | Write-Output;
    $token = $login.accessToken
} catch {
    Write-Output 'LOGIN ERROR';
    if ($_.Exception.Response) {
        $_.Exception.Response.StatusCode.Value__ | Write-Output;
        $_.Exception.Response.GetResponseStream() | % { new-object System.IO.StreamReader($_) } | % { $_.ReadToEnd() } | Write-Output
    } else {
        $_ | Format-List | Out-String | Write-Output
    };
    $token = $null
};

if ($token) {
    Start-Sleep -Seconds 1;
    Write-Output 'Calling protected endpoint...';
    try {
        $prot = Invoke-RestMethod -Uri 'http://localhost:3001/api/protected' -Method Get -Headers @{ Authorization = "Bearer $token" };
        $prot | ConvertTo-Json -Depth 5 | Write-Output
    } catch {
        Write-Output 'PROTECTED ERROR';
        if ($_.Exception.Response) {
            $_.Exception.Response.StatusCode.Value__ | Write-Output;
            $_.Exception.Response.GetResponseStream() | % { new-object System.IO.StreamReader($_) } | % { $_.ReadToEnd() } | Write-Output
        } else {
            $_ | Format-List | Out-String | Write-Output
        }
    }
} else {
    Write-Output 'Skipping protected call due to missing token'
}
`;

try {
    execSync(`powershell -Command "${command}"`, { stdio: 'inherit' });
    console.log('\nEndpoint tests completed successfully');
    process.exit(0);
} catch (error) {
    console.error('\nEndpoint tests failed:', error);
    process.exit(1);
}