import os
import re

base_dir = r"c:\Users\aryan\Downloads\swissgain-main\swissgain-main\client\src"

img_tag_pattern = re.compile(r'<img\b([^>]*)>', re.IGNORECASE)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    def replace_img(match):
        attrs = match.group(1)
        
        # Don't add lazy loading if loading is already specified
        if re.search(r'\bloading=', attrs, re.IGNORECASE):
            return match.group(0)
            
        # Add loading="lazy" at the end of the opening tag
        return f'<img loading="lazy"{attrs}>'

    content = img_tag_pattern.sub(replace_img, content)
    
    # We also need to add f_auto,q_auto to cloudinary urls where obvious.
    # Cloudinary URLs usually look like: src="https://res.cloudinary.com/..."
    # The getOptimizedImageUrl helper handles some, but let's globally append it if not present.
    # Actually, a regex might be risky for all Cloudinary strings if they have logic.
    # Let's focus on string literals with res.cloudinary.com in them that are inside src=""
    # We will look for src="...res.cloudinary.com/.../upload/..." and add f_auto,q_auto/ if missing.
    
    def replace_cloud(match):
        prefix = match.group(1)
        upload_part = match.group(2)
        rest = match.group(3)
        if "f_auto,q_auto" in rest:
            return match.group(0)
        # Check if there are already some transformations
        if re.match(r'^[a-z_]+,[a-z_0-9]+', rest):
            return f'{prefix}{upload_part}f_auto,q_auto,{rest}'
        else:
            return f'{prefix}{upload_part}f_auto,q_auto/{rest}'
            
    content = re.sub(r'(src=[\'"]https://res\.cloudinary\.com/[^/]+/image/upload/)(.*?)([\'"])', lambda m: m.group(1) + ("f_auto,q_auto/" + m.group(2) if "f_auto,q_auto" not in m.group(2) else m.group(2)) + m.group(3), content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith(('.tsx', '.jsx', '.ts', '.js')):
            process_file(os.path.join(root, file))

print("Image optimization complete.")
