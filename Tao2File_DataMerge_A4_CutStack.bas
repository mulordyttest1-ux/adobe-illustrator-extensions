Attribute VB_Name = "InLatTay_CutStack"
Sub Tao2File_CutStack_MultiPage()
    ' --- SCRIPT BINH TRANG VA DANH SO NHAY CHO INDESIGN (CAT GOP STACK) ---
    ' Muc dich: Tu dong tach 2 file Front/Back theo thu tu de InDesign Multiple Record
    '            (Order: By Column) xep dung Quyen 1 ben Trai, Quyen 2 ben Phải.
    
    Dim numBooklets As Integer
    Dim sheetsPerBook As Integer
    Dim itemsPerSide As Integer
    Dim startNum As Long
    Dim lenNum As Integer
    Dim printMode As Integer
    
    Dim itemsPerBook As Long
    Dim p As Integer, s As Integer, item As Integer
    Dim b1 As Integer, b2 As Integer
    Dim contentFront As String, contentBack As String
    Dim folderPath As String
    
    ' --- 1. NHAP CAU HINH ---
    On Error Resume Next
    numBooklets = Application.InputBox("1. SO QUYEN CAN IN? (Vd: 16)", "Cau Hinh", 16, Type:=1)
    If numBooklets <= 0 Then Exit Sub
    
    sheetsPerBook = Application.InputBox("2. SO TO TREN 1 QUYEN? (Vd: 50 to = 100 trang)", "Cau Hinh", 50, Type:=1)
    If sheetsPerBook <= 0 Then Exit Sub
    
    itemsPerSide = Application.InputBox("3. SO VARIABLE (SO) TREN 1 MAT A5? (Vd: 3)", "Cau Hinh", 3, Type:=1)
    If itemsPerSide <= 0 Then Exit Sub
    
    startNum = Application.InputBox("So bat dau? (Vd: 1)", "Dinh Dang", 1, Type:=1)
    lenNum = Application.InputBox("Do dai so (Vd: 5 cho 00001):", "Dinh Dang", 5, Type:=1)
    
    printMode = Application.InputBox("CHE DO SO NHAY:" & vbCrLf & _
                                     "1 = Tuan tu lien tiep (Q1: 1-300, Q2: 301-600)" & vbCrLf & _
                                     "2 = Lap lai giong het nhau (Q1: 1-300, Q2: 1-300)", "Che Do", 1, Type:=1)
    If printMode <> 1 And printMode <> 2 Then Exit Sub
    On Error GoTo 0
    
    ' --- 2. THUAT TOAN CUT & STACK ---
    ' Moi quyen co (sheets * items * 2 mat). Vd 50 to * 3 tem * 2 mat = 300 tem/quyen
    itemsPerBook = sheetsPerBook * itemsPerSide * 2
    
    ' Tao Header cho N cot (Vd: So_1,So_2,So_3)
    Dim header As String
    header = ""
    For item = 1 To itemsPerSide
        header = header & "So_" & item & IIf(item < itemsPerSide, ",", "")
    Next item
    header = header & vbCrLf
    
    contentFront = header
    contentBack = header
    
    ' Lap theo tung cap quyen (Binh Q1/Q2 len to 1, Q3/Q4 len to 2...)
    Dim pairs As Integer
    pairs = Int((numBooklets + 1) / 2)
    
    For p = 1 To pairs
        b1 = (p * 2) - 1
        b2 = p * 2
        
        For s = 1 To sheetsPerBook
            ' Base number dua tren che do in
            Dim base1 As Long, base2 As Long
            If printMode = 1 Then
                base1 = startNum + (b1 - 1) * itemsPerBook + (s - 1) * (itemsPerSide * 2)
                base2 = startNum + (b2 - 1) * itemsPerBook + (s - 1) * (itemsPerSide * 2)
            Else
                base1 = startNum + (s - 1) * (itemsPerSide * 2)
                base2 = startNum + (s - 1) * (itemsPerSide * 2)
            End If
            
            Dim b2IsValid As Boolean
            b2IsValid = (b2 <= numBooklets)
            
            ' --------- MAT TRUOC (FRONT) ---------
            ' Quyển b1 (Trái)
            Dim rowQ1F As String: rowQ1F = ""
            For item = 0 To itemsPerSide - 1
                rowQ1F = rowQ1F & Format(base1 + item, String(lenNum, "0")) & IIf(item < itemsPerSide - 1, ",", "")
            Next item
            contentFront = contentFront & rowQ1F & vbCrLf
            
            ' Quyển b2 (Phải)
            Dim rowQ2F As String: rowQ2F = ""
            For item = 0 To itemsPerSide - 1
                If b2IsValid Then
                    rowQ2F = rowQ2F & Format(base2 + item, String(lenNum, "0")) & IIf(item < itemsPerSide - 1, ",", "")
                Else
                    rowQ2F = rowQ2F & String(lenNum, "0") & IIf(item < itemsPerSide - 1, ",", "")
                End If
            Next item
            contentFront = contentFront & rowQ2F & vbCrLf
            
            ' --------- MAT SAU (BACK) ---------
            ' Quyển b1 (Trái)
            Dim rowQ1B As String: rowQ1B = ""
            For item = itemsPerSide To (itemsPerSide * 2) - 1
                rowQ1B = rowQ1B & Format(base1 + item, String(lenNum, "0")) & IIf(item - itemsPerSide < itemsPerSide - 1, ",", "")
            Next item
            contentBack = contentBack & rowQ1B & vbCrLf
            
            ' Quyển b2 (Phải)
            Dim rowQ2B As String: rowQ2B = ""
            For item = itemsPerSide To (itemsPerSide * 2) - 1
                If b2IsValid Then
                    rowQ2B = rowQ2B & Format(base2 + item, String(lenNum, "0")) & IIf(item - itemsPerSide < itemsPerSide - 1, ",", "")
                Else
                    rowQ2B = rowQ2B & String(lenNum, "0") & IIf(item - itemsPerSide < itemsPerSide - 1, ",", "")
                End If
            Next item
            contentBack = contentBack & rowQ2B & vbCrLf
            
        Next s
    Next p
    
    ' --- 3. XUAT FILE ---
    With Application.FileDialog(msoFileDialogFolderPicker)
        .Title = "CHON THU MUC LUU"
        If .Show = -1 Then folderPath = .SelectedItems(1) Else Exit Sub
    End With
    
    Call GhiFileUTF16(folderPath & "\Front_CutStack_MultiVar.txt", contentFront)
    Call GhiFileUTF16(folderPath & "\Back_CutStack_MultiVar.txt", contentBack)
    
    MsgBox "DA XONG! Mo InDesign Data Merge se thay cac bien: So_1, So_2, So_3...", vbInformation
End Sub

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
