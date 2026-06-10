import os

def swap_files(directory, id1, id2):
    file1 = os.path.join(directory, f"hero_{id1}.webp")
    file2 = os.path.join(directory, f"hero_{id2}.webp")
    temp = os.path.join(directory, "hero_temp.webp")
    
    if os.path.exists(file1) and os.path.exists(file2):
        print(f"Swapping in {directory}: hero_{id1}.webp <-> hero_{id2}.webp")
        os.rename(file1, temp)
        os.rename(file2, file1)
        os.rename(temp, file2)
        print("Swap completed.")
    else:
        print(f"Error: One or both files do not exist: {file1}, {file2}")

def main():
    banners_dir = "public/assets/banners"
    paintings_dir = "public/assets/paintings"
    
    # Lukas (127) <-> Kalea (128)
    swap_files(banners_dir, 127, 128)
    swap_files(paintings_dir, 127, 128)

if __name__ == '__main__':
    main()
