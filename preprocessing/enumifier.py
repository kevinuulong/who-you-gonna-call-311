# WARNING: This code is AI generated. Use with caution.

import pandas as pd
import json

def shrink_csv(input_file, output_csv, output_json, 
               enum_cols=None, date_cols=None, shared_groups=None, 
               keep_cols=None, drop_cols=None):
    
    df = pd.read_csv(input_file)

    # 1. Column Filtering
    if keep_cols:
        df = df[keep_cols]
    elif drop_cols:
        # Only drop columns that actually exist to avoid errors
        df = df.drop(columns=[c for c in drop_cols if c in df.columns])

    js_maps = {}

    # 2. Date Handling (Unix Timestamps)
    if date_cols:
        for col in [c for c in date_cols if c in df.columns]:
            # Convert to seconds; errors become NaT (Not a Time)
            dt_series = pd.to_datetime(df[col], errors='coerce')
            # Use 0 for invalid dates; convert to integer seconds
            df[col] = (dt_series.astype('int64') // 10**9).clip(lower=0)

    # 3. Shared Enum Groups (Bulky Items, etc.)
    if shared_groups:
        for group_name, cols in shared_groups.items():
            existing_cols = [c for c in cols if c in df.columns]
            if not existing_cols: continue
            
            # Get unique values across all columns in the group
            clean_cats = sorted(pd.unique(df[existing_cols].values.ravel().astype(str)))
            js_maps[group_name] = [c for c in clean_cats if c != 'nan']
            
            val_to_idx = {val: i for i, val in enumerate(js_maps[group_name])}
            for col in existing_cols:
                df[col] = df[col].astype(str).map(val_to_idx).fillna(-1).astype(int)

    # 4. Standard Enumify (Single Columns)
    if enum_cols:
        for col in [c for c in enum_cols if c in df.columns]:
            # Ensure we don't re-process columns already handled by shared_groups
            if shared_groups and any(col in group for group in shared_groups.values()):
                continue
            
            df[col] = df[col].astype('category')
            js_maps[col] = df[col].cat.categories.tolist()
            df[col] = df[col].cat.codes

    # 5. Export
    df.to_csv(output_csv, index=False)
    with open(output_json, 'w') as f:
        json.dump(js_maps, f, indent=2)
    
    print(f"Done! Created {output_csv} and {output_json}")

# --- YOUR USAGE ---
shrink_csv(
    input_file='./preprocessing/311Full2025.csv',
    output_csv='./preprocessing/out/311Compressed2025.csv',
    output_json='./preprocessing/out/maps.json',
    
    enum_cols=['SR_TYPE', 'SR_TYPE_DESC', 'PRIORITY', 'GROUP_TITLE', 'GROUP_DESC', 
               'DEPT_CODE', 'DEPT_NAME', 'DEPT_DIVISION', 'NEIGHBORHOOD', 
               'METHOD_RECEIVED', 'SR_STATUS', 'SR_STATUS_FLAG', 'COLLECTION_DAY', 
               'PROPTY_CITY_DEPT_OWNER', 'CITY_ID', 'MUNITWNSHP', 
               'COMMUNITY_COUNCIL_NEIGHBORHOOD'],
    
    # Example shared group if you want to use it:
    # shared_groups={
    #     "BULKY_ITEMS": ['BULKY_ITEM_1', 'BULKY_ITEM_2', 'BULKY_ITEM_3', 'BULKY_ITEM_4', 'BULKY_ITEM_5']
    # },

    # date_cols=['DATE_STATUS_CHANGE', 'DATE_LAST_UPDATE', 'PLANNED_END_DATE', 'DATE_TIME_RECEIVED'],
    
    drop_cols=['SEGIDUSNG_XREF', 'HAM_PAVE_POLYGON_ID', 'NEAREST_PARCEL_NO', 'SR_NUMBER', 'USER_ID']
)
