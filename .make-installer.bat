@DEL /S /Q dist

@CALL yarn tsc
@CALL yarn electron-builder --win --x64
