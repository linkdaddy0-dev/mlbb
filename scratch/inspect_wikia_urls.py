import re

def main():
    path = r"C:\Users\rosha\.gemini\antigravity-ide\brain\af46b533-c862-4ccd-92a3-23a298e49c92\.system_generated\steps\1026\content.md"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    urls = re.findall(r'https://[^\s"\'>]+\.(?:png|webp|jpg|jpeg)[^\s"\'>]*', content)
    unique_urls = sorted(list(set(urls)))
    
    print(f"Found {len(unique_urls)} unique images:")
    for url in unique_urls:
        url_lower = url.lower()
        if ('.png' in url_lower or '.webp' in url_lower) and ('miya' in url_lower or 'hero' in url_lower):
            print(url)

if __name__ == '__main__':
    main()
