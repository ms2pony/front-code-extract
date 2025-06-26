# git-proxy.ps1

# 使用方法
# .\git-proxy.ps1 -mode off   # 关闭代理并保存当前配置
# .\git-proxy.ps1 -mode on    # 恢复上次保存的代理配置

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("on", "off")]
    [string]$mode
)

$proxyConfigFile = "$HOME\.git_proxy_backup.json"

function Disable-GitProxy {
    Write-Host "📦 获取当前 Git 代理配置..."
    $currentHttp = git config --global --get http.proxy
    $currentHttps = git config --global --get https.proxy

    $proxySettings = @{
        "http.proxy"  = $currentHttp
        "https.proxy" = $currentHttps
    }

    # 保存当前代理配置到文件
    $proxySettings | ConvertTo-Json | Set-Content -Path $proxyConfigFile -Encoding UTF8
    Write-Host "📝 已保存当前代理配置到 $proxyConfigFile"

    # 取消代理
    git config --global --unset http.proxy
    git config --global --unset https.proxy
    Write-Host "✅ 已取消 Git 全局代理"
}

function Enable-GitProxy {
    if (-Not (Test-Path $proxyConfigFile)) {
        Write-Warning "⚠️ 找不到备份文件：$proxyConfigFile，无法恢复代理"
        return
    }

    $settings = Get-Content $proxyConfigFile | ConvertFrom-Json
    if ($settings.'http.proxy') {
        git config --global http.proxy $settings.'http.proxy'
        Write-Host "✅ 已恢复 http.proxy：$($settings.'http.proxy')"
    }
    if ($settings.'https.proxy') {
        git config --global https.proxy $settings.'https.proxy'
        Write-Host "✅ 已恢复 https.proxy：$($settings.'https.proxy')"
    }
}

if ($mode -eq "off") {
    Disable-GitProxy
} elseif ($mode -eq "on") {
    Enable-GitProxy
}
