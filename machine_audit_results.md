# 🤖 Machine-Verified Hardcode Audit

Generated at: 2026-02-11T03:16:34.293Z

**Scope:** `cep/js` (Excluding bundle.js, libs)
**Schema Keys Tracked:** 16

## 🔴 Implicit Logic (Nguy hiểm - Cần Refactor)
Logic dựa trên việc "đoán" tên biến (includes, indexOf).

| File | Line | Code Snippet | Term |
|---|---|---|---|
| `cep\js\logic\ux\InputEngine.js` | 33 | `if (lowerKey.includes('gio')) return 'date_hour';...` | **gio** |
| `cep\js\logic\ux\InputEngine.js` | 34 | `if (lowerKey.includes('phut')) return 'date_minute';...` | **phut** |
| `cep\js\logic\ux\InputEngine.js` | 37 | `if (lowerKey.includes('ngay')) return 'date_day';...` | **ngay** |
| `cep\js\logic\ux\InputEngine.js` | 38 | `if (lowerKey.includes('thang')) return 'date_month';...` | **thang** |
| `cep\js\logic\ux\InputEngine.js` | 39 | `if (lowerKey.includes('nam') && !lowerKey.includes('ten')) r...` | **ten** |
| `cep\js\logic\ux\InputEngine.js` | 39 | `if (lowerKey.includes('nam') && !lowerKey.includes('ten')) r...` | **nam** |
| `cep\js\logic\ux\InputEngine.js` | 42 | `if (lowerKey.includes('ten') || lowerKey.includes('ong') || ...` | **ten** |
| `cep\js\logic\ux\InputEngine.js` | 42 | `if (lowerKey.includes('ten') || lowerKey.includes('ong') || ...` | **ho_ten** |
| `cep\js\logic\ux\InputEngine.js` | 43 | `if (lowerKey.includes('diachi') || lowerKey.includes('addres...` | **diachi** |
| `cep\js\logic\ux\InputEngine.js` | 43 | `if (lowerKey.includes('diachi') || lowerKey.includes('addres...` | **address** |
| `cep\js\logic\ux\InputEngine.js` | 43 | `if (lowerKey.includes('diachi') || lowerKey.includes('addres...` | **venue** |
| `cep\js\logic\ux\InputEngine.js` | 43 | `if (lowerKey.includes('diachi') || lowerKey.includes('addres...` | **ceremony** |
| `cep\js\components\modules\AddressService.js` | 10 | `if (!key.includes('diachi')) return;...` | **diachi** |
| `cep\js\components\DateGridRenderer.js` | 49 | `const isMaster = config.key.includes('tiec');...` | **tiec** |
| `cep\js\components\DateGridWidget.js` | 20 | `if (!config.key.includes('tiec')) {...` | **tiec** |

## 🟠 Explicit Hardcoding (Cần Schema Integration)
Code sử dụng trực tiếp key string thay vì đọc từ config.

| File | Line | Code Snippet | Schema Key |
|---|---|---|---|
| `cep\js\logic\domain\rules.js` | 66 | `const hostType = packet['ceremony.host_type'];...` | `ceremony.host_type` |
| `cep\js\logic\domain\rules.js` | 67 | `const tenLe = packet['info.ten_le'] || '';...` | `info.ten_le` |
| `cep\js\logic\domain\rules.js` | 68 | `const valNam = packet['ui.vithu_nam'] || '';...` | `ui.vithu_nam` |
| `cep\js\logic\domain\rules.js` | 69 | `const valNu = packet['ui.vithu_nu'] || '';...` | `ui.vithu_nu` |
| `cep\js\logic\domain\venue.js` | 33 | `const ceremonyName = packet['ceremony.ten'] || '';...` | `ceremony.ten` |
| `cep\js\logic\domain\venue.js` | 39 | `const venueName = packet['venue.ten'] || '';...` | `venue.ten` |
| `cep\js\logic\domain\venue.js` | 54 | `const tenLe = packet['info.ten_le'] || 'Tân Hôn';...` | `info.ten_le` |
| `cep\js\logic\domain\venue.js` | 55 | `const hostType = packet['ceremony.host_type'];...` | `ceremony.host_type` |
| `cep\js\logic\domain\venue.js` | 81 | `packet['ceremony.ten'] = labelTugia;...` | `ceremony.ten` |
| `cep\js\logic\domain\venue.js` | 82 | `packet['ceremony.diachi'] = sourceAddr;...` | `ceremony.diachi` |
| `cep\js\logic\domain\venue.js` | 91 | `packet['venue.ten'] = labelTugia;...` | `venue.ten` |
| `cep\js\logic\domain\venue.js` | 92 | `packet['venue.diachi'] = sourceAddr;...` | `venue.diachi` |
| `cep\js\logic\domain\time.js` | 14 | `'date.tiec': { h: 11, m: 0 },...` | `date.tiec` |
| `cep\js\logic\domain\time.js` | 15 | `'date.le': { h: 9, m: 0 },...` | `date.le` |
| `cep\js\logic\domain\time.js` | 16 | `'date.nhap': { h: 17, m: 0 }...` | `date.nhap` |
| `cep\js\logic\domain\time.js` | 70 | `'date.tiec': times.TIEC,...` | `date.tiec` |
| `cep\js\logic\domain\time.js` | 71 | `'date.le': times.LE,...` | `date.le` |
| `cep\js\logic\domain\time.js` | 72 | `'date.nhap': times.NHAP...` | `date.nhap` |
| `cep\js\logic\pipeline\validator.js` | 21 | `if (!packet['info.ten_le']) {...` | `info.ten_le` |
| `cep\js\logic\pipeline\validator.js` | 26 | `if (!packet['date.tiec']) {...` | `date.tiec` |
| `cep\js\logic\ux\InputEngine.js` | 42 | `if (lowerKey.includes('ten') || lowerKey.includes('ong') || ...` | `ong` |
| `cep\js\logic\ux\InputEngine.js` | 42 | `if (lowerKey.includes('ten') || lowerKey.includes('ong') || ...` | `ba` |
| `cep\js\logic\ux\InputEngine.js` | 43 | `if (lowerKey.includes('diachi') || lowerKey.includes('addres...` | `diachi` |
| `cep\js\logic\ux\validators\DateValidator.js` | 49 | `const tiec = parse('date.tiec');...` | `date.tiec` |
| `cep\js\logic\ux\validators\DateValidator.js` | 50 | `const le = parse('date.le');...` | `date.le` |
| `cep\js\logic\ux\validators\DateValidator.js` | 51 | `const nhap = parse('date.nhap');...` | `date.nhap` |
| `cep\js\components\modules\AddressService.js` | 10 | `if (!key.includes('diachi')) return;...` | `diachi` |
| `cep\js\components\modules\FormLogic.js` | 17 | `const hostRef = refs['ceremony.host_type'];...` | `ceremony.host_type` |
| `cep\js\components\modules\FormLogic.js` | 18 | `const leRef = refs['info.ten_le'];...` | `info.ten_le` |
| `cep\js\components\modules\FormLogic.js` | 21 | `const ceremonyTen = refs['ceremony.ten'];...` | `ceremony.ten` |
| `cep\js\components\modules\FormLogic.js` | 22 | `const ceremonyAddr = refs['ceremony.diachi'];...` | `ceremony.diachi` |
| `cep\js\components\modules\FormLogic.js` | 25 | `const venueTen = refs['venue.ten'];...` | `venue.ten` |
| `cep\js\components\modules\FormLogic.js` | 26 | `const venueAddr = refs['venue.diachi'];...` | `venue.diachi` |
| `cep\js\components\modules\FormLogic.js` | 31 | `const hostOptions = this._getSchemaOptions('ceremony.host_ty...` | `ceremony.host_type` |
| `cep\js\components\modules\FormLogic.js` | 47 | `this.builder._handleChange('ceremony.host_type', targetHost)...` | `ceremony.host_type` |
| `cep\js\components\modules\FormLogic.js` | 66 | `this.builder._handleChange('ceremony.ten', tuGiaLabel);...` | `ceremony.ten` |
| `cep\js\components\modules\FormLogic.js` | 70 | `this.builder._handleChange('ceremony.diachi', sourceAddr);...` | `ceremony.diachi` |
| `cep\js\components\modules\FormLogic.js` | 71 | `if (typeof InputEngine !== 'undefined') InputEngine.process(...` | `ceremony.diachi` |
| `cep\js\components\modules\FormLogic.js` | 79 | `this.builder._handleChange('venue.ten', tuGiaLabel);...` | `venue.ten` |
| `cep\js\components\modules\FormLogic.js` | 83 | `this.builder._handleChange('venue.diachi', sourceAddr);...` | `venue.diachi` |
| `cep\js\components\modules\FormComponents.js` | 40 | `this.builder.refs['info.event_type'] = eventSelect;...` | `info.event_type` |
| `cep\js\components\modules\FormComponents.js` | 44 | `const leRadioGroup = this._createInlineRadio('info.ten_le', ...` | `info.ten_le` |
| `cep\js\components\modules\FormComponents.js` | 52 | `row2.appendChild(this._createInlineRadio('ui.vithu_nam', ['T...` | `ui.vithu_nam` |
| `cep\js\components\modules\FormComponents.js` | 58 | `row2.appendChild(this._createInlineRadio('ui.vithu_nu', ['Tr...` | `ui.vithu_nu` |
| `cep\js\components\modules\FormComponents.js` | 85 | `{ label: 'Ông', key: 'ong', hasIdx: true, rows: 1 },...` | `ong` |
| `cep\js\components\modules\FormComponents.js` | 86 | `{ label: 'Bà', key: 'ba', hasIdx: true, rows: 1 },...` | `ba` |
| `cep\js\components\modules\FormComponents.js` | 87 | `{ label: 'Địa chỉ', key: 'diachi', hasIdx: false, rows: 2 },...` | `diachi` |
| `cep\js\components\modules\FormComponents.js` | 88 | `{ label: 'Con', key: 'con_full', hasIdx: true, rows: 1 }...` | `con_full` |
| `cep\js\components\modules\FormComponents.js` | 121 | `const hostRadio = this._createInlineRadio('ceremony.host_typ...` | `ceremony.host_type` |
| `cep\js\components\modules\FormComponents.js` | 136 | `row1.appendChild(this._createInputWithAuto('ceremony.ten', t...` | `ceremony.ten` |
| `cep\js\components\modules\FormComponents.js` | 137 | `row1.appendChild(this._createInputWithAuto('venue.ten', true...` | `venue.ten` |
| `cep\js\components\modules\FormComponents.js` | 144 | `row2.appendChild(this._createTextarea('ceremony.diachi', 2))...` | `ceremony.diachi` |
| `cep\js\components\modules\FormComponents.js` | 145 | `row2.appendChild(this._createTextarea('venue.diachi', 2));...` | `venue.diachi` |
| `cep\js\components\modules\FormComponents.js` | 162 | `{ key: 'date.tiec', label: 'Tiệc' },...` | `date.tiec` |
| `cep\js\components\modules\FormComponents.js` | 163 | `{ key: 'date.le', label: 'Lễ' },...` | `date.le` |
| `cep\js\components\modules\FormComponents.js` | 164 | `{ key: 'date.nhap', label: 'Nháp' }...` | `date.nhap` |
| `cep\js\components\DateGridWidget.js` | 74 | `if (baseKey === 'date.tiec') this._syncDependentRows();...` | `date.tiec` |
| `cep\js\components\DateGridWidget.js` | 82 | `if (baseKey === 'date.tiec') this._syncDependentRows();...` | `date.tiec` |
| `cep\js\components\DateGridWidget.js` | 100 | `if (baseKey === 'date.tiec' && type === 'solar') {...` | `date.tiec` |
| `cep\js\components\DateGridWidget.js` | 109 | `if (this._refs['date.le_auto']?.checked) this._syncFromMaste...` | `date.le` |
| `cep\js\components\DateGridWidget.js` | 110 | `if (this._refs['date.nhap_auto']?.checked) this._syncFromMas...` | `date.nhap` |
| `cep\js\components\DateGridWidget.js` | 114 | `const tiecState = DateGridDOM.getSolarState(this._refs, 'dat...` | `date.tiec` |
| `cep\js\components\DateGridWidget.js` | 163 | `const dateKeys = ['date.tiec', 'date.le', 'date.nhap'];...` | `date.tiec` |
| `cep\js\components\DateGridWidget.js` | 163 | `const dateKeys = ['date.tiec', 'date.le', 'date.nhap'];...` | `date.le` |
| `cep\js\components\DateGridWidget.js` | 163 | `const dateKeys = ['date.tiec', 'date.le', 'date.nhap'];...` | `date.nhap` |
| `cep\js\controllers\helpers\KeyNormalizer.js` | 53 | `const dateKeys = ['date.tiec', 'date.le', 'date.nhap'];...` | `date.tiec` |
| `cep\js\controllers\helpers\KeyNormalizer.js` | 53 | `const dateKeys = ['date.tiec', 'date.le', 'date.nhap'];...` | `date.le` |
| `cep\js\controllers\helpers\KeyNormalizer.js` | 53 | `const dateKeys = ['date.tiec', 'date.le', 'date.nhap'];...` | `date.nhap` |
| `cep\js\actions\ScanAction.js` | 60 | `const hostType = normalized['ceremony.host_type'];...` | `ceremony.host_type` |
| `cep\js\actions\ScanAction.js` | 61 | `const tenLe = normalized['info.ten_le'] || '';...` | `info.ten_le` |
| `cep\js\actions\ScanAction.js` | 75 | `if (normalized['pos1.vithu']) normalized['ui.vithu_nu'] = no...` | `ui.vithu_nu` |
| `cep\js\actions\ScanAction.js` | 76 | `if (normalized['pos2.vithu']) normalized['ui.vithu_nam'] = n...` | `ui.vithu_nam` |
| `cep\js\actions\ScanAction.js` | 78 | `if (normalized['pos1.vithu']) normalized['ui.vithu_nam'] = n...` | `ui.vithu_nam` |
| `cep\js\actions\ScanAction.js` | 79 | `if (normalized['pos2.vithu']) normalized['ui.vithu_nu'] = no...` | `ui.vithu_nu` |
| `cep\js\actions\SwapAction.js` | 57 | `const hostRef = builder.refs['ceremony.host_type'];...` | `ceremony.host_type` |
| `cep\js\actions\SwapAction.js` | 63 | `const el = builder.refs['ceremony.ten'];...` | `ceremony.ten` |
| `cep\js\actions\SwapAction.js` | 65 | `const addrEl = builder.refs['ceremony.diachi'];...` | `ceremony.diachi` |
| `cep\js\actions\SwapAction.js` | 69 | `const el = builder.refs['venue.ten'];...` | `venue.ten` |
| `cep\js\actions\SwapAction.js` | 71 | `const addrEl = builder.refs['venue.diachi'];...` | `venue.diachi` |
