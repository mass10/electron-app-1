# ファイル: install.nsh
# 概要: NSIS include script (for Windows)
# encoding: UTF-8

# インストーラー実行後
!macro customInstall
    WriteRegStr SHCTX "Software\Irisawa\Masaru\node-1" "" "$INSTDIR"
!macroend

# アンインストーラー実行後
!macro customUnInstall
    DeleteRegKey SHCTX "Software\Irisawa\Masaru"
    DeleteRegKey /IfEmpty SHCTX "Software\Irisawa"
!macroend
