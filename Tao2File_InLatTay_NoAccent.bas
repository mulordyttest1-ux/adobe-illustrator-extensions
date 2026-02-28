Attribute VB_Name = "Module1"
Sub Tao2File_InLatTay_NoAccent()
    ' --- KHAI BAO BIEN ---
    Dim startNum As Long, endNum As Long
    Dim lenNum As Integer
    Dim itemsPerPage As Integer
    Dim i As Long
    Dim contentFront As String, contentBack As String
    Dim strNum As String
    Dim folderPath As String
    Dim currentCount As Integer
    Dim isFront As Boolean
    
    ' --- 1. NHAP CAU HINH ---
    On Error Resume Next
    
    startNum = Application.InputBox("Nhap SO BAT DAU:", "Cau Hinh", 1, Type:=1)
    If startNum = 0 Then Exit Sub
    
    endNum = Application.InputBox("Nhap SO KET THUC:", "Cau Hinh", 100, Type:=1)
    
    Dim defaultLen As Integer
    defaultLen = Len(CStr(endNum))
    lenNum = Application.InputBox("Do dai day so (0 = tu dong):", "Dinh Dang", defaultLen, Type:=1)
    
    ' QUAN TRONG: Phai biet so luong tem tren 1 to in de chia file
    itemsPerPage = Application.InputBox("SO LUONG TEM TREN 1 TRANG IN?" & vbNewLine & _
                                        "(Vd: 1 trang A4 binh 10 con tem -> Nhap 10)", "Binh Bai", 1, Type:=1)
                                        
    If itemsPerPage <= 0 Then Exit Sub
    On Error GoTo 0

    ' --- 2. XU LY CHIA TACH DU LIEU ---
    ' Tao tieu de cho ca 2 file
    contentFront = "SoThuTu" & vbCrLf
    contentBack = "SoThuTu" & vbCrLf
    
    currentCount = 0
    isFront = True ' Bat dau la Mat Truoc
    
    For i = startNum To endNum
        ' Format so 0
        strNum = Format(i, String(lenNum, "0"))
        
        ' Kiem tra ghi vao Mat Truoc hay Mat Sau
        If isFront = True Then
            contentFront = contentFront & strNum & vbCrLf
        Else
            contentBack = contentBack & strNum & vbCrLf
        End If
        
        ' Tang dem so luong tem da xep len trang hien tai
        currentCount = currentCount + 1
        
        ' Neu da xep du so tem cua 1 trang -> Chuyen sang mat kia (hoac trang tiep theo)
        If currentCount >= itemsPerPage Then
            currentCount = 0 ' Reset dem
            isFront = Not isFront ' Dao chieu: Truoc -> Sau, hoac Sau -> Truoc
        End If
    Next i
    
    ' --- 3. XUAT RA 2 FILE RIENG BIET ---
    ' Chon thu moc luu
    With Application.FileDialog(msoFileDialogFolderPicker)
        .Title = "CHON THU MUC LUU 2 FILE TXT"
        If .Show = -1 Then
            folderPath = .SelectedItems(1)
        Else
            Exit Sub
        End If
    End With
    
    ' Ham ghi file (Dung o duoi)
    Call GhiFileUTF16(folderPath & "\Data_MAT_TRUOC.txt", contentFront)
    Call GhiFileUTF16(folderPath & "\Data_MAT_SAU.txt", contentBack)
    
    MsgBox "DA XONG!" & vbNewLine & _
           "1. Data_MAT_TRUOC.txt (Chua: 1, 2, 3...)" & vbNewLine & _
           "2. Data_MAT_SAU.txt   (Chua: 4, 5, 6...)" & vbNewLine & _
           "Luu tai: " & folderPath, vbInformation, "Thanh Cong"

End Sub

' --- HAM HO TRO GHI FILE UNICODE ---
Sub GhiFileUTF16(filePath As String, content As String)
    Dim stream As Object
    Set stream = CreateObject("ADODB.Stream")
    With stream
        .Type = 2
        .Charset = "UTF-16"
        .Open
        .WriteText content
        .SaveToFile filePath, 2
        .Close
    End With
End Sub

