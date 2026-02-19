Dim fso, batPath
Set fso = CreateObject("Scripting.FileSystemObject")
batPath = fso.GetParentFolderName(WScript.ScriptFullName) & "\앱시작.bat"

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c """ & batPath & """", 0, False
