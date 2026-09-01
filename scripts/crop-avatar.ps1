param(
  [Parameter(Mandatory = $true)]
  [string]$Source,
  [Parameter(Mandatory = $true)]
  [string]$Destination,
  [int]$Size = 256,
  [double]$CropRatio = 0.85
)

Add-Type -AssemblyName System.Drawing

$sourcePath = [System.IO.Path]::GetFullPath($Source)
$destinationPath = [System.IO.Path]::GetFullPath($Destination)
$destinationDirectory = [System.IO.Path]::GetDirectoryName($destinationPath)

if (-not (Test-Path -LiteralPath $sourcePath)) {
  throw "Source image not found: $sourcePath"
}

[System.IO.Directory]::CreateDirectory($destinationDirectory) | Out-Null

$sourceImage = $null
$bitmap = $null
$graphics = $null

try {
  $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
  $baseLength = [Math]::Min($sourceImage.Width, $sourceImage.Height)
  $cropLength = [Math]::Floor($baseLength * $CropRatio)
  $cropX = [Math]::Floor(($sourceImage.Width - $cropLength) / 2)
  $cropY = [Math]::Max(0, [Math]::Floor(($sourceImage.Height - $cropLength) * 0.32))

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $destinationRect = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
  $sourceRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropLength, $cropLength)
  $graphics.DrawImage($sourceImage, $destinationRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
  $bitmap.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  if ($graphics) { $graphics.Dispose() }
  if ($bitmap) { $bitmap.Dispose() }
  if ($sourceImage) { $sourceImage.Dispose() }
}

Write-Output $destinationPath
