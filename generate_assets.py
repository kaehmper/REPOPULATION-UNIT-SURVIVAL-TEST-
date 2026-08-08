from PIL import Image, ImageDraw

def create_asset(filename, size, shape, color):
    # size is (width, height)
    img = Image.new('RGBA', size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    if shape == 'circle':
        draw.ellipse([0, 0, size[0]-1, size[1]-1], fill=color, outline="black")
    elif shape == 'rect':
        draw.rectangle([0, 0, size[0]-1, size[1]-1], fill=color, outline="black")
    elif shape == 'diamond':
        draw.polygon([(size[0]/2, 0), (size[0], size[1]/2), (size[0]/2, size[1]), (0, size[1]/2)], fill=color, outline="black")

    img.save(f'public/assets/{filename}.png')

if __name__ == "__main__":
    # entities
    create_asset('player', (32, 32), 'circle', (50, 150, 255)) # Blue
    create_asset('scientist', (32, 32), 'circle', (255, 100, 100)) # Red
    create_asset('wolf', (24, 24), 'circle', (100, 100, 100)) # Gray
    create_asset('pig', (24, 24), 'circle', (255, 182, 193)) # Pink
    create_asset('chicken', (16, 16), 'circle', (255, 255, 255)) # White

    # resources
    create_asset('tree', (48, 64), 'diamond', (34, 139, 34)) # Forest Green
    create_asset('rock', (40, 40), 'rect', (169, 169, 169)) # Dark Gray
    create_asset('wood', (16, 16), 'rect', (139, 69, 19)) # Brown (item drop)
    create_asset('stone', (16, 16), 'rect', (128, 128, 128)) # Gray (item drop)

    # tiles
    create_asset('grass', (64, 64), 'rect', (124, 252, 0)) # Lawn Green
    create_asset('dirt', (64, 64), 'rect', (139, 69, 19)) # Saddle Brown
    create_asset('water', (64, 64), 'rect', (65, 105, 225)) # Royal Blue

    print("Assets generated.")
