import os
import csv
import shutil
import re
from datetime import datetime

# --- 1. 設定路徑 ---
input_dir = 'assets/images/illustrations/download/to_do/'
# 圖片輸出的位置
img_output_dir = 'assets/images/illustrations/download/output/'
# CSV 輸出的位置 (根目錄下的 output 資料夾)
csv_output_dir = 'output/'

# 如果資料夾不存在，則建立它們
for folder in [img_output_dir, csv_output_dir]:
    if not os.path.exists(folder):
        os.makedirs(folder)
        print(f"📁 已建立資料夾：{folder}")

# 支援的圖片副檔名
valid_extensions = ('.png', '.jpg', '.jpeg', '.webp', '.svg')

# --- 2. 執行處理邏輯 ---
try:
    # 取得檔案清單並排序
    files = [f for f in os.listdir(input_dir) if f.lower().endswith(valid_extensions)]
    files.sort()

    if not files:
        print("查無圖片檔案，請確認 to_do 資料夾內是否有圖。")
    else:
        temp_data = []
        max_post_num = 0

        for filename in files:
            name_part, ext_part = os.path.splitext(filename)
            
            # 拆解檔名：開頭數字 + 分隔符 + 剩下的文字
            match = re.match(r'^(\d+)[-_](.*)$', name_part)
            
            if match:
                post_num_str = match.group(1)
                image_slug = match.group(2)
                # 轉換為整數來比較最大值
                current_num = int(post_num_str)
                if current_num > max_post_num:
                    max_post_num = current_num
            else:
                post_num_str = ""
                image_slug = name_part
                print(f"⚠️ 警告：{filename} 格式不符，已跳過數字拆解")

            # 先將資料暫存在 list 中
            temp_data.append({
                'raw_name': filename,
                'post_num': post_num_str,
                'image_slug': image_slug,
                'ext': ext_part
            })

        # --- 3. 生成動態 CSV 檔名 ---
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        csv_file_name = f'mdlist_to{max_post_num}_{timestamp}.csv'
        csv_full_path = os.path.join(csv_output_dir, csv_file_name)

        # --- 4. 寫入 CSV 與 複製圖片 ---
        with open(csv_full_path, mode='w', encoding='utf-8-sig', newline='') as f:
            fieldnames = ['raw_name', 'post_num', 'image_slug']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for item in temp_data:
                # 寫入 CSV
                writer.writerow({
                    'raw_name': item['raw_name'],
                    'post_num': item['post_num'],
                    'image_slug': item['image_slug']
                })

                # 複製並更名圖片
                new_filename = f"{item['image_slug']}{item['ext']}"
                src_path = os.path.join(input_dir, item['raw_name'])
                dst_path = os.path.join(img_output_dir, new_filename)
                shutil.copy2(src_path, dst_path)

        print(f"\n🎉 處理完成！")
        print(f"📊 CSV 已產出至：{csv_full_path}")
        print(f"🖼️  圖片已複製至：{img_output_dir}")
        print(f"✅ 總共處理了 {len(temp_data)} 個檔案，最大編號為：{max_post_num}")

except Exception as e:
    print(f"❌ 發生錯誤：{e}")