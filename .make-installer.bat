@DEL /S /Q dist

@CALL yarn install
@CALL yarn tsc --build
@CALL yarn electron-builder --win --x64
