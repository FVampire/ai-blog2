$destination = 'D:\workspace\demo\ai-blog2\public\projects\forgetting-tide\gameplay-frames'
New-Item -ItemType Directory -Force -Path $destination | Out-Null
Copy-Item -LiteralPath 'C:\Users\ASUS\.codex\generated_images\01a04681-55e0-7430-bef6-5e3fdbff5bbb\exec-75e19351-5cc8-471e-95aa-006a3e589f75.png' -Destination (Join-Path $destination '01-camp-start.png')
Copy-Item -LiteralPath 'C:\Users\ASUS\.codex\generated_images\01a04681-55e0-7430-bef6-5e3fdbff5bbb\exec-0019e964-47e7-4940-9df4-a44bc70934c3.png' -Destination (Join-Path $destination '02-camp-tidegate-end.png')
Copy-Item -LiteralPath 'C:\Users\ASUS\.codex\generated_images\01a04681-55e0-7430-bef6-5e3fdbff5bbb\exec-6dda9e45-1167-47d8-a96b-77124dae7bed.png' -Destination (Join-Path $destination '03-hospital-entry-start.png')
Copy-Item -LiteralPath 'C:\Users\ASUS\.codex\generated_images\01a04681-55e0-7430-bef6-5e3fdbff5bbb\exec-9b57360c-f6a0-41f7-8b6c-cdfa6abd64de.png' -Destination (Join-Path $destination '04-hospital-witness-end.png')
Copy-Item -LiteralPath 'C:\Users\ASUS\.codex\generated_images\01a04681-55e0-7430-bef6-5e3fdbff5bbb\exec-818e6ccd-e1c8-4395-b8d6-27c333c26bd0.png' -Destination (Join-Path $destination '05-battle-ready-start.png')
Copy-Item -LiteralPath 'C:\Users\ASUS\.codex\generated_images\01a04681-55e0-7430-bef6-5e3fdbff5bbb\exec-1963555c-bc1f-46ed-b3a1-a1318f0d4795.png' -Destination (Join-Path $destination '06-battle-combo-end.png')
Copy-Item -LiteralPath 'C:\Users\ASUS\.codex\generated_images\01a04681-55e0-7430-bef6-5e3fdbff5bbb\exec-7c755c5d-f537-4638-b155-4f49b4797fb7.png' -Destination (Join-Path $destination '07-reflection-prison-start.png')
Copy-Item -LiteralPath 'C:\Users\ASUS\.codex\generated_images\01a04681-55e0-7430-bef6-5e3fdbff5bbb\exec-5f593022-58c1-47c7-8483-dde380b1473b.png' -Destination (Join-Path $destination '08-reflection-garden-end.png')
