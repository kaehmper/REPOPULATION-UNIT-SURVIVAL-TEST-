from PIL import Image, ImageDraw

def create_pixel_asset(filename, size, asset_type):
    img = Image.new('RGBA', size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    w, h = size
    if asset_type == 'scientist':
        # Simple pixel art scientist (white lab coat)
        draw.rectangle([w//4, h//4, w*3//4, h-4], fill=(240, 240, 240)) # Body
        draw.rectangle([w//3, h//8, w*2//3, h//4], fill=(255, 220, 180)) # Head
        draw.rectangle([w//3, h//8+2, w*2//3, h//8+6], fill=(100, 100, 255)) # Goggles
        draw.rectangle([w//4, h-4, w//3+2, h], fill=(50, 50, 50)) # Left leg
        draw.rectangle([w*2//3-2, h-4, w*3//4, h], fill=(50, 50, 50)) # Right leg
    elif asset_type == 'wolf':
        # Gray wolf
        draw.rectangle([w//6, h//3, w*5//6, h*2//3], fill=(120, 120, 120)) # Body
        draw.rectangle([w*2//3, h//6, w-2, h//2], fill=(120, 120, 120)) # Head
        draw.rectangle([w-6, h//6+2, w-2, h//6+6], fill=(200, 0, 0)) # Eye
        draw.rectangle([2, h//3+4, w//6, h//3+8], fill=(120, 120, 120)) # Tail
        for i in range(4): # Legs
            draw.rectangle([w//4 + i*(w//6), h*2//3, w//4 + i*(w//6) + 4, h], fill=(80, 80, 80))
    elif asset_type == 'pig':
        # Pink pig
        draw.rectangle([w//6, h//3, w*5//6, h*3//4], fill=(255, 150, 200)) # Body
        draw.rectangle([w*2//3, h//4, w-2, h*2//3], fill=(255, 150, 200)) # Head
        draw.rectangle([w-6, h//3, w-2, h//3+8], fill=(255, 100, 150)) # Snout
        for i in range(4): # Legs
            draw.rectangle([w//4 + i*(w//6), h*3//4, w//4 + i*(w//6) + 3, h], fill=(200, 100, 150))
    elif asset_type == 'chicken':
        # White chicken
        draw.rectangle([w//4, h//3, w*3//4, h*2//3], fill=(255, 255, 255)) # Body
        draw.rectangle([w//2, h//8, w-2, h//2], fill=(255, 255, 255)) # Head
        draw.rectangle([w-4, h//4, w, h//4+4], fill=(255, 200, 0)) # Beak
        draw.rectangle([w//2+2, h//8-4, w-4, h//8], fill=(255, 0, 0)) # Comb
        draw.rectangle([w//3, h*2//3, w//3+2, h], fill=(255, 200, 0)) # Leg 1
        draw.rectangle([w*2//3-2, h*2//3, w*2//3, h], fill=(255, 200, 0)) # Leg 2
    elif asset_type == 'tree':
        # Pixel tree
        draw.rectangle([w//2-4, h//2, w//2+4, h], fill=(101, 67, 33)) # Trunk
        # Leaves
        draw.ellipse([0, 0, w, h*3//4], fill=(34, 139, 34))
        draw.ellipse([4, 4, w-4, h*3//4-4], fill=(44, 159, 44)) # highlight
    elif asset_type == 'rock':
        # Pixel rock
        draw.ellipse([2, h//4, w-2, h], fill=(120, 120, 120))
        draw.ellipse([6, h//4+4, w-6, h-4], fill=(150, 150, 150))
        draw.ellipse([8, h//4+8, w-12, h//2], fill=(180, 180, 180)) # highlight
    elif asset_type == 'wood':
        draw.rectangle([0, h//3, w, h*2//3], fill=(139, 69, 19))
        draw.rectangle([0, h//3+2, w, h*2//3-2], fill=(160, 82, 45))
    elif asset_type == 'stone':
        draw.ellipse([0, 0, w, h], fill=(128, 128, 128))
        draw.ellipse([2, 2, w-2, h-2], fill=(160, 160, 160))
    elif asset_type == 'grass':
        draw.rectangle([0, 0, w, h], fill=(85, 170, 85))
        # Add some grass blades
        for i in range(5):
            for j in range(5):
                draw.rectangle([i*12+4, j*12+4, i*12+6, j*12+8], fill=(100, 200, 100))
    elif asset_type == 'dirt':
        draw.rectangle([0, 0, w, h], fill=(139, 69, 19))
        for i in range(5):
            for j in range(5):
                draw.rectangle([i*12+2, j*12+2, i*12+4, j*12+4], fill=(160, 82, 45))
    elif asset_type == 'water':
        draw.rectangle([0, 0, w, h], fill=(65, 105, 225))
        for i in range(4):
            for j in range(4):
                draw.rectangle([i*16+4, j*16+8, i*16+12, j*16+10], fill=(100, 149, 237))

    img.save(f'public/assets/{filename}.png')
    print(f"Created {filename}.png")

if __name__ == "__main__":
    create_pixel_asset('scientist', (32, 32), 'scientist')
    create_pixel_asset('wolf', (32, 32), 'wolf')
    create_pixel_asset('pig', (32, 32), 'pig')
    create_pixel_asset('chicken', (16, 16), 'chicken')

    create_pixel_asset('tree', (48, 64), 'tree')
    create_pixel_asset('rock', (40, 40), 'rock')
    create_pixel_asset('wood', (16, 16), 'wood')
    create_pixel_asset('stone', (16, 16), 'stone')

    create_pixel_asset('grass', (64, 64), 'grass')
    create_pixel_asset('dirt', (64, 64), 'dirt')
    create_pixel_asset('water', (64, 64), 'water')
