#!/usr/bin/env python
"""
Extract tiles from MBTiles file to folder structure
No external dependencies required - uses built-in sqlite3
"""

import sqlite3
import os
import sys

def extract_mbtiles(mbtiles_path, output_dir):
    """Extract tiles from MBTiles to {z}/{x}/{y}.png structure"""
    
    if not os.path.exists(mbtiles_path):
        print(f"Error: File not found: {mbtiles_path}")
        return False
    
    print(f"Opening MBTiles file: {mbtiles_path}")
    
    try:
        # Connect to MBTiles database
        conn = sqlite3.connect(mbtiles_path)
        cursor = conn.cursor()
        
        # Get tile count
        cursor.execute("SELECT COUNT(*) FROM tiles")
        total_tiles = cursor.fetchone()[0]
        print(f"Found {total_tiles:,} tiles to extract")
        print(f"Output directory: {output_dir}")
        print()
        
        # Extract tiles
        cursor.execute("SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles")
        
        extracted = 0
        for row in cursor:
            zoom, x, y_tms, tile_data = row
            
            # Convert TMS y to XYZ y (flip vertically)
            y = (2 ** zoom - 1) - y_tms
            
            # Create directory structure
            tile_dir = os.path.join(output_dir, str(zoom), str(x))
            os.makedirs(tile_dir, exist_ok=True)
            
            # Write tile
            tile_path = os.path.join(tile_dir, f"{y}.png")
            with open(tile_path, 'wb') as f:
                f.write(tile_data)
            
            extracted += 1
            if extracted % 100 == 0:
                percent = (extracted / total_tiles) * 100
                print(f"\rProgress: {extracted:,}/{total_tiles:,} ({percent:.1f}%)", end='', flush=True)
        
        print(f"\n✅ Successfully extracted {extracted:,} tiles!")
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("MBTiles Extractor")
    print("=" * 60)
    print()
    
    if len(sys.argv) < 2:
        print("Usage: python extract_mbtiles.py <path-to-mbtiles-file>")
        print()
        print("Example:")
        print("  python extract_mbtiles.py C:\\Downloads\\map.mbtiles")
        print()
        sys.exit(1)
    
    mbtiles_path = sys.argv[1]
    
    # Output to tiles directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(os.path.dirname(script_dir), 'tiles')
    
    success = extract_mbtiles(mbtiles_path, output_dir)
    
    print()
    print("=" * 60)
    if success:
        print("Done! Run 'npm run check-tiles' to verify.")
    else:
        print("Extraction failed. Please check the error messages above.")
    print("=" * 60)
    
    sys.exit(0 if success else 1)
