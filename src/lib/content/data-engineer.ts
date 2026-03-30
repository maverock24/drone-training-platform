import { LessonContent } from "./types";

export const dataEngineerContent: LessonContent[] = [
  // ─── LESSON 1: PostGIS & Spatial Indexing ───
  {
    lessonId: "postgis",
    trackId: "data-engineer",
    moduleId: "geoai",
    objectives: [
      "Set up PostgreSQL with PostGIS for spatial drone data management",
      "Write spatial SQL queries using ST_DWithin, ST_Intersects, and ST_Contains",
      "Build and optimize GiST and SP-GiST spatial indexes for fast geospatial lookups",
      "Model drone flight corridors, survey zones, and asset locations as spatial types",
      "Combine spatial queries with time-series telemetry for real-time fleet analytics",
    ],
    prerequisites: [
      "Intermediate SQL knowledge (JOINs, subqueries, window functions)",
      "Basic understanding of coordinate systems (latitude, longitude, WGS84)",
      "Familiarity with PostgreSQL administration (CREATE TABLE, indexing basics)",
    ],
    sections: [
      {
        id: "postgis-intro",
        title: "Why PostGIS for Drone Data?",
        type: "theory",
        content:
          "Every piece of drone data is inherently spatial. Every image has GPS coordinates, every LiDAR point cloud covers a physical area, every telemetry log traces a flight path through 3D space. Yet most AI training pipelines store this data in flat CSV files or basic SQL tables, losing the spatial dimension entirely.\n\nPostGIS extends PostgreSQL with spatial data types (POINT, LINESTRING, POLYGON, GEOMETRY), spatial indexing (GiST trees), and over 300 spatial functions. It allows you to ask questions that would be impossible in standard SQL: 'Find all images taken within 50 meters of a power line,' 'Which survey zones overlap with the new construction area?', 'What is the total area covered by today's flights?'\n\nFor drone operations at scale — fleet management across hundreds of drones, millions of images, and thousands of flight missions — spatial indexing is the difference between a 45-second query and a 3-millisecond query. A GiST (Generalized Search Tree) index on geometry columns enables logarithmic-time spatial lookups by organizing data in a bounding-box hierarchy.\n\nPostGIS also supports 3D geometries and geography types (which account for Earth's curvature), making it ideal for drone applications where altitude matters. You can model drone no-fly zones as 3D volumes and query whether a planned flight path intersects restricted airspace.\n\nIn 2026, PostGIS 3.5+ includes native support for point cloud storage (via the pointcloud extension), vector tile generation for web maps, and improved parallel spatial query execution. Combined with pg_partman for time-based partitioning, you can build drone data warehouses that handle billions of spatial records efficiently.",
      },
      {
        id: "postgis-setup",
        title: "Setting Up PostGIS for Drone Operations",
        type: "code",
        content:
          "Let's set up a PostGIS database with a schema designed for drone data — storing flight paths, captured images with GPS coordinates, survey zones, and infrastructure assets. This schema supports the full lifecycle of drone data management, from flight planning to image retrieval.",
        language: "sql",
        code: `-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- for text search on metadata

-- Drone fleet table
CREATE TABLE drones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(50),
    payload_type VARCHAR(50),  -- 'thermal', 'rgb', 'lidar', 'multispectral'
    max_altitude_m FLOAT DEFAULT 120,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flight missions with path geometry
CREATE TABLE flight_missions (
    id SERIAL PRIMARY KEY,
    drone_id INT REFERENCES drones(id),
    mission_name VARCHAR(200),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    flight_path GEOMETRY(LINESTRINGZ, 4326),  -- 3D path in WGS84
    survey_area GEOMETRY(POLYGON, 4326),       -- planned survey boundary
    altitude_agl_m FLOAT,                      -- above ground level
    status VARCHAR(20) DEFAULT 'planned',
    metadata JSONB DEFAULT '{}'
);

-- Captured images with spatial location
CREATE TABLE drone_images (
    id BIGSERIAL PRIMARY KEY,
    mission_id INT REFERENCES flight_missions(id),
    captured_at TIMESTAMPTZ NOT NULL,
    location GEOMETRY(POINTZ, 4326),  -- 3D point (lon, lat, alt)
    footprint GEOMETRY(POLYGON, 4326), -- ground coverage polygon
    heading_deg FLOAT,
    pitch_deg FLOAT,
    roll_deg FLOAT,
    gsd_cm FLOAT,  -- ground sampling distance
    file_path TEXT NOT NULL,
    file_size_mb FLOAT,
    image_type VARCHAR(20),  -- 'rgb', 'thermal', 'nir'
    quality_score FLOAT,     -- 0-1 score from auto-QA
    labels JSONB DEFAULT '[]',
    embedding VECTOR(512)    -- for similarity search (pgvector)
);

-- Infrastructure assets to monitor
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    asset_type VARCHAR(50),  -- 'power_line', 'tower', 'pipeline', 'building'
    name VARCHAR(200),
    geom GEOMETRY(GEOMETRY, 4326),  -- can be POINT, LINE, or POLYGON
    inspection_interval_days INT DEFAULT 90,
    last_inspected TIMESTAMPTZ,
    risk_score FLOAT DEFAULT 0.0,
    metadata JSONB DEFAULT '{}'
);

-- No-fly zones (3D restricted airspace)
CREATE TABLE no_fly_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    zone_type VARCHAR(50),  -- 'airport', 'military', 'temporary'
    boundary GEOMETRY(POLYGON, 4326),
    floor_altitude_m FLOAT DEFAULT 0,
    ceiling_altitude_m FLOAT DEFAULT 120,
    active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ
);

-- Spatial indexes (GiST) for fast queries
CREATE INDEX idx_images_location ON drone_images USING GIST (location);
CREATE INDEX idx_images_footprint ON drone_images USING GIST (footprint);
CREATE INDEX idx_missions_path ON flight_missions USING GIST (flight_path);
CREATE INDEX idx_missions_area ON flight_missions USING GIST (survey_area);
CREATE INDEX idx_assets_geom ON assets USING GIST (geom);
CREATE INDEX idx_nfz_boundary ON no_fly_zones USING GIST (boundary);

-- Composite indexes for time + space queries
CREATE INDEX idx_images_time_location ON drone_images
    USING GIST (location) WHERE captured_at > NOW() - INTERVAL '30 days';
CREATE INDEX idx_images_captured ON drone_images (captured_at DESC);

-- Partitioning by month for large image tables
-- (recommended when > 10M images)
CREATE TABLE drone_images_partitioned (
    LIKE drone_images INCLUDING ALL
) PARTITION BY RANGE (captured_at);

CREATE TABLE drone_images_2026_01 PARTITION OF drone_images_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE drone_images_2026_02 PARTITION OF drone_images_partitioned
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');`,
      },
      {
        id: "postgis-spatial-queries",
        title: "Essential Spatial Queries for Drone Operations",
        type: "code",
        content:
          "These are the spatial queries you'll use daily in drone data pipelines — from finding images near assets to calculating coverage gaps. Each query leverages spatial indexes for sub-millisecond performance even with millions of records.",
        language: "sql",
        code: `-- ==============================================
-- QUERY 1: Find all images taken within 50m of power lines
-- ==============================================
SELECT di.id, di.file_path, di.captured_at, di.gsd_cm,
       ST_Distance(di.location::geography, a.geom::geography) AS distance_m
FROM drone_images di
JOIN assets a ON ST_DWithin(
    di.location::geography,
    a.geom::geography,
    50  -- meters (geography type uses meters)
)
WHERE a.asset_type = 'power_line'
  AND di.captured_at > NOW() - INTERVAL '7 days'
ORDER BY distance_m ASC;

-- ==============================================
-- QUERY 2: Calculate total area surveyed per drone this month
-- ==============================================
SELECT d.name AS drone_name,
       COUNT(fm.id) AS missions,
       ST_Area(ST_Union(fm.survey_area)::geography) / 1e6 AS total_area_km2,
       SUM(EXTRACT(EPOCH FROM (fm.end_time - fm.start_time))) / 3600 AS flight_hours
FROM flight_missions fm
JOIN drones d ON fm.drone_id = d.id
WHERE fm.start_time >= DATE_TRUNC('month', NOW())
  AND fm.status = 'completed'
GROUP BY d.name
ORDER BY total_area_km2 DESC;

-- ==============================================
-- QUERY 3: Find coverage gaps — areas in survey zone not yet imaged
-- ==============================================
WITH mission_coverage AS (
    SELECT fm.id AS mission_id,
           fm.survey_area,
           ST_Union(di.footprint) AS covered_area
    FROM flight_missions fm
    LEFT JOIN drone_images di ON di.mission_id = fm.id
    WHERE fm.id = 42  -- specific mission
    GROUP BY fm.id, fm.survey_area
)
SELECT mission_id,
       ST_Area(survey_area::geography) / 10000 AS planned_ha,
       ST_Area(covered_area::geography) / 10000 AS covered_ha,
       ST_Area(ST_Difference(survey_area, covered_area)::geography) / 10000 AS gap_ha,
       ROUND(100.0 * ST_Area(covered_area::geography) /
             NULLIF(ST_Area(survey_area::geography), 0), 1) AS coverage_pct
FROM mission_coverage;

-- ==============================================
-- QUERY 4: Flight path vs no-fly zone intersection check
-- ==============================================
SELECT fm.mission_name,
       nfz.name AS restricted_zone,
       nfz.zone_type,
       ST_Length(ST_Intersection(fm.flight_path, nfz.boundary)::geography) AS violation_m
FROM flight_missions fm
JOIN no_fly_zones nfz ON ST_Intersects(fm.flight_path, nfz.boundary)
WHERE nfz.active = true
  AND fm.status = 'planned'
  AND (fm.altitude_agl_m BETWEEN nfz.floor_altitude_m AND nfz.ceiling_altitude_m)
ORDER BY violation_m DESC;

-- ==============================================
-- QUERY 5: K-Nearest Neighbor search — find 10 closest images to a point
-- ==============================================
SELECT id, file_path, captured_at,
       ST_Distance(
           location::geography,
           ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography
       ) AS dist_m
FROM drone_images
ORDER BY location <-> ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)
LIMIT 10;  -- Uses GiST index for efficient KNN

-- ==============================================
-- QUERY 6: Assets overdue for inspection, ranked by risk
-- ==============================================
SELECT a.name, a.asset_type, a.risk_score,
       a.last_inspected,
       NOW() - a.last_inspected AS days_overdue,
       ST_AsGeoJSON(a.geom)::jsonb AS geojson
FROM assets a
WHERE a.last_inspected < NOW() - (a.inspection_interval_days || ' days')::interval
ORDER BY a.risk_score DESC, (NOW() - a.last_inspected) DESC
LIMIT 20;`,
      },
      {
        id: "postgis-functions",
        title: "Custom Spatial Functions for Drone Pipelines",
        type: "code",
        content:
          "These PL/pgSQL functions encapsulate common drone data operations — from computing image footprints to finding optimal inspection routes. These become reusable building blocks in your data pipelines.",
        language: "sql",
        code: `-- Function: Calculate image ground footprint from camera parameters
CREATE OR REPLACE FUNCTION compute_image_footprint(
    center_point GEOMETRY(POINTZ, 4326),
    heading_deg FLOAT,
    fov_x_deg FLOAT DEFAULT 84.0,  -- DJI Mavic 3 horizontal FOV
    fov_y_deg FLOAT DEFAULT 62.0,  -- vertical FOV
    sensor_width_mm FLOAT DEFAULT 17.3,
    focal_length_mm FLOAT DEFAULT 12.3
) RETURNS GEOMETRY(POLYGON, 4326) AS $$
DECLARE
    alt_m FLOAT;
    half_width_m FLOAT;
    half_height_m FLOAT;
    heading_rad FLOAT;
    corners GEOMETRY[];
BEGIN
    alt_m := ST_Z(center_point);
    half_width_m := alt_m * TAN(RADIANS(fov_x_deg / 2));
    half_height_m := alt_m * TAN(RADIANS(fov_y_deg / 2));
    heading_rad := RADIANS(heading_deg);

    -- Project 4 corners from center point
    corners := ARRAY[
        ST_Project(ST_Project(center_point::geography, half_height_m, heading_rad),
                   half_width_m, heading_rad + PI()/2)::geometry,
        ST_Project(ST_Project(center_point::geography, half_height_m, heading_rad),
                   half_width_m, heading_rad - PI()/2)::geometry,
        ST_Project(ST_Project(center_point::geography, half_height_m, heading_rad + PI()),
                   half_width_m, heading_rad - PI()/2)::geometry,
        ST_Project(ST_Project(center_point::geography, half_height_m, heading_rad + PI()),
                   half_width_m, heading_rad + PI()/2)::geometry
    ];

    RETURN ST_SetSRID(ST_MakePolygon(ST_MakeLine(
        ARRAY[corners[1], corners[2], corners[3], corners[4], corners[1]]
    )), 4326);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Find optimal inspection route (nearest-neighbor heuristic)
CREATE OR REPLACE FUNCTION plan_inspection_route(
    start_lon FLOAT, start_lat FLOAT,
    max_assets INT DEFAULT 20
) RETURNS TABLE(
    visit_order INT,
    asset_id INT,
    asset_name VARCHAR,
    distance_from_prev_m FLOAT,
    cumulative_distance_m FLOAT
) AS $$
DECLARE
    current_point GEOMETRY;
    visited INT[] := '{}';
    next_id INT;
    next_geom GEOMETRY;
    total_dist FLOAT := 0;
    step INT := 0;
BEGIN
    current_point := ST_SetSRID(ST_MakePoint(start_lon, start_lat), 4326);

    FOR i IN 1..max_assets LOOP
        -- Find nearest unvisited asset overdue for inspection
        SELECT a.id, ST_Centroid(a.geom) INTO next_id, next_geom
        FROM assets a
        WHERE a.id != ALL(visited)
          AND a.last_inspected < NOW() - (a.inspection_interval_days || ' days')::interval
        ORDER BY a.geom <-> current_point
        LIMIT 1;

        EXIT WHEN next_id IS NULL;

        step := step + 1;
        visited := visited || next_id;
        distance_from_prev_m := ST_Distance(current_point::geography, next_geom::geography);
        total_dist := total_dist + distance_from_prev_m;

        visit_order := step;
        asset_id := next_id;
        asset_name := (SELECT name FROM assets WHERE id = next_id);
        cumulative_distance_m := total_dist;
        RETURN NEXT;

        current_point := next_geom;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Usage: plan route starting from base station
-- SELECT * FROM plan_inspection_route(-122.4194, 37.7749, 15);`,
      },
      {
        id: "postgis-exercise",
        title: "Lab: Build a Drone Data API with PostGIS",
        type: "exercise",
        content:
          "**Objective:** Build a Python FastAPI service that exposes PostGIS spatial queries for a drone fleet management system.\n\n**Tasks:**\n\n1. **Set up the database** — Create the schema from this lesson and populate it with 1,000 synthetic drone images spread across a 10km × 10km area. Use Python's `faker` and `shapely` libraries to generate realistic GPS coordinates, flight paths, and image metadata.\n\n2. **Implement spatial search endpoint** — `GET /images/nearby?lat=37.77&lon=-122.42&radius=100&type=thermal` that returns images within a given radius of a point, filtered by image type. Use PostGIS `ST_DWithin` via SQLAlchemy + GeoAlchemy2.\n\n3. **Implement coverage analysis** — `GET /missions/{id}/coverage` that returns the coverage percentage, gap areas as GeoJSON, and statistics for a given mission.\n\n4. **Implement flight validation** — `POST /flights/validate` that accepts a GeoJSON flight path and returns any no-fly zone intersections with violation distances.\n\n5. **Add spatial clustering** — `GET /images/clusters?zoom=12` that returns clustered image counts using `ST_ClusterDBSCAN` for efficient map visualization at different zoom levels.\n\n6. **Performance test** — Generate 1 million image records and measure query times before and after adding spatial indexes. Document the speedup in a results table.\n\n**Expected deliverables:** A working FastAPI application with all 5 endpoints, a SQL migration script, a data seeding script, and a performance benchmark report.",
      },
      {
        id: "postgis-quiz",
        title: "Knowledge Check",
        type: "quiz",
        content:
          "**Q1:** What is the key difference between PostGIS `geometry` and `geography` types, and when should you use each for drone data?\n\n**A1:** `geometry` operates on a flat Cartesian plane (faster computations, accurate for small areas), while `geography` accounts for Earth's curvature using geodesic math (slower but accurate globally). For drone operations spanning a few km, `geometry` with a projected CRS (like UTM) is fastest. For fleet management across countries, `geography` ensures distance calculations are correct.\n\n**Q2:** Why does a GiST index on a geometry column use bounding boxes rather than exact geometry shapes?\n\n**A2:** Exact geometry comparison is computationally expensive. GiST indexes store bounding boxes in a tree hierarchy, enabling fast coarse filtering. PostGIS uses a two-phase approach: (1) index filter using bounding boxes (fast, may include false positives), then (2) exact geometry test on the filtered results. This makes spatial queries O(log n) instead of O(n).\n\n**Q3:** How would you query 'Find all drone images captured between 10am-2pm yesterday whose ground footprint overlaps with any power line asset, ordered by ground sampling distance'?\n\n**A3:**\n```sql\nSELECT di.*, ST_Area(ST_Intersection(di.footprint, a.geom)::geography) AS overlap_m2\nFROM drone_images di\nJOIN assets a ON ST_Intersects(di.footprint, a.geom)\nWHERE a.asset_type = 'power_line'\n  AND di.captured_at BETWEEN\n      (CURRENT_DATE - 1 + TIME '10:00') AND\n      (CURRENT_DATE - 1 + TIME '14:00')\nORDER BY di.gsd_cm ASC;\n```",
      },
    ],
    keyTakeaways: [
      "PostGIS transforms PostgreSQL into a spatial database capable of handling millions of georeferenced drone records",
      "GiST spatial indexes provide O(log n) query performance on geometry columns",
      "The geometry vs geography distinction matters — use geography for global accuracy, geometry for speed at local scale",
      "Custom PL/pgSQL functions encapsulate complex spatial operations into reusable pipeline components",
      "Partitioning by time combined with spatial indexing handles massive drone image archives efficiently",
    ],
    resources: [
      { title: "PostGIS Official Documentation", url: "https://postgis.net/documentation/" },
      { title: "Introduction to PostGIS (Workshop)", url: "https://postgis.net/workshops/postgis-intro/" },
      { title: "GeoAlchemy2 (Python ORM for PostGIS)", url: "https://geoalchemy-2.readthedocs.io/" },
      { title: "Spatial SQL for Drone Data (Tutorial)", url: "https://postgis.net/docs/using_postgis_dbmanagement.html" },
    ],
  },

  // ─── LESSON 2: STAC API Implementation ───
  {
    lessonId: "stac",
    trackId: "data-engineer",
    moduleId: "geoai",
    objectives: [
      "Understand the STAC specification (Catalog, Collection, Item) and why it matters for drone imagery",
      "Build a STAC-compliant API that makes drone images searchable by time, location, and properties",
      "Implement STAC extensions for drone-specific metadata (EO, SAR, view geometry)",
      "Integrate STAC with PostGIS for high-performance spatiotemporal queries",
      "Deploy a production STAC catalog using stac-fastapi with pgstac backend",
    ],
    prerequisites: [
      "Completion of PostGIS & Spatial Indexing lesson",
      "Experience with REST API design and FastAPI or Flask",
      "Understanding of GeoJSON format",
    ],
    sections: [
      {
        id: "stac-why",
        title: "The Drone Imagery Discovery Problem",
        type: "theory",
        content:
          "A single drone survey mission can generate 2,000-10,000 images. A fleet of 50 drones operating daily produces millions of images per year. The fundamental challenge isn't storage — it's discovery. How do you find the specific images you need?\n\nConsider these real queries an AI engineer might ask: 'Find all thermal images of the northern perimeter captured in the last 48 hours with GSD under 3cm' or 'Get every image covering structure #4417 across all missions since its last repair.' Without a structured catalog, engineers resort to manually browsing folders, parsing filenames, or building custom scripts — a process that consumes hours.\n\nThe SpatioTemporal Asset Catalog (STAC) specification solves this by defining a standard JSON-based language for describing geospatial data. STAC is used by NASA, ESA, Planet Labs, and major satellite companies. Applying it to drone data gives you:\n\n**Catalog → Collection → Item** hierarchy:\n- **Catalog**: Top-level container (e.g., 'DroneAI Imagery Catalog')\n- **Collection**: Group of related items (e.g., 'Forest Survey Q1 2026', 'Power Line Inspections')\n- **Item**: Single spatiotemporal asset — one image with its metadata, location, timestamp, and links to the actual file\n\nEach Item has a GeoJSON geometry (the image footprint), a datetime, a bbox, and properties that can include any custom metadata. STAC extensions add domain-specific fields: `eo:cloud_cover`, `view:off_nadir`, `processing:software`.\n\nThe STAC API specification adds search capabilities: filter by bbox, datetime range, collection, and arbitrary properties. For drone operations, this transforms image discovery from hours to milliseconds.",
      },
      {
        id: "stac-items",
        title: "Creating STAC Items from Drone Imagery",
        type: "code",
        content:
          "This Python script creates STAC Items from drone image metadata. It extracts EXIF data, computes image footprints, and produces valid STAC JSON that can be ingested into any STAC catalog.",
        language: "python",
        code: `import json
from datetime import datetime, timezone
from pathlib import Path
import pystac
from pystac.extensions.eo import EOExtension, Band
from pystac.extensions.view import ViewExtension
from shapely.geometry import Polygon, mapping
import exifread
import pyproj

def extract_drone_metadata(image_path: str) -> dict:
    """Extract GPS, camera, and flight metadata from drone image EXIF."""
    with open(image_path, 'rb') as f:
        tags = exifread.process_file(f, details=False)

    def dms_to_decimal(dms, ref):
        d, m, s = [float(x.num) / float(x.den) for x in dms.values]
        decimal = d + m / 60 + s / 3600
        return -decimal if ref in ['S', 'W'] else decimal

    return {
        'lat': dms_to_decimal(tags['GPS GPSLatitude'], str(tags['GPS GPSLatitudeRef'])),
        'lon': dms_to_decimal(tags['GPS GPSLongitude'], str(tags['GPS GPSLongitudeRef'])),
        'alt': float(tags['GPS GPSAltitude'].values[0].num) /
               float(tags['GPS GPSAltitude'].values[0].den),
        'datetime': datetime.strptime(str(tags['EXIF DateTimeOriginal']),
                                       '%Y:%m:%d %H:%M:%S').replace(tzinfo=timezone.utc),
        'camera_model': str(tags.get('Image Model', 'unknown')),
        'focal_length': float(tags.get('EXIF FocalLength', '0').values[0].num) /
                        max(float(tags.get('EXIF FocalLength', '1').values[0].den), 1),
    }

def compute_footprint(lat: float, lon: float, alt: float,
                      fov_x: float = 84.0, fov_y: float = 62.0) -> Polygon:
    """Compute ground footprint polygon from camera position and FOV."""
    import math
    half_w = alt * math.tan(math.radians(fov_x / 2))
    half_h = alt * math.tan(math.radians(fov_y / 2))

    # Project to local UTM, compute corners, project back
    utm_zone = int((lon + 180) / 6) + 1
    proj = pyproj.Transformer.from_crs(4326, f"EPSG:326{utm_zone:02d}", always_xy=True)
    proj_inv = pyproj.Transformer.from_crs(f"EPSG:326{utm_zone:02d}", 4326, always_xy=True)

    cx, cy = proj.transform(lon, lat)
    corners_utm = [
        (cx - half_w, cy + half_h), (cx + half_w, cy + half_h),
        (cx + half_w, cy - half_h), (cx - half_w, cy - half_h),
    ]
    corners_wgs84 = [proj_inv.transform(x, y) for x, y in corners_utm]
    return Polygon(corners_wgs84)

def create_stac_item(image_path: str, collection_id: str) -> pystac.Item:
    """Create a STAC Item from a drone image with full metadata."""
    meta = extract_drone_metadata(image_path)
    footprint = compute_footprint(meta['lat'], meta['lon'], meta['alt'])
    bbox = list(footprint.bounds)

    item = pystac.Item(
        id=Path(image_path).stem,
        geometry=mapping(footprint),
        bbox=bbox,
        datetime=meta['datetime'],
        properties={
            'platform': 'drone',
            'instruments': [meta['camera_model']],
            'gsd': (meta['alt'] * 0.00345) / meta['focal_length'] * 100,  # cm/px
            'drone:altitude_m': meta['alt'],
            'drone:flight_id': collection_id,
            'processing:level': 'L1',  # raw georeferenced
        }
    )

    # Add EO extension for band information
    eo_ext = EOExtension.ext(item, add_if_missing=True)
    eo_ext.bands = [
        Band.create(name='red', common_name='red', center_wavelength=0.65),
        Band.create(name='green', common_name='green', center_wavelength=0.56),
        Band.create(name='blue', common_name='blue', center_wavelength=0.47),
    ]

    # Add view extension for imaging geometry
    view_ext = ViewExtension.ext(item, add_if_missing=True)
    view_ext.off_nadir = 0.0  # nadir-looking (straight down)

    # Add asset links
    item.add_asset('image', pystac.Asset(
        href=f"s3://drone-imagery/{collection_id}/{Path(image_path).name}",
        media_type=pystac.MediaType.GEOTIFF,
        roles=['data', 'visual'],
        title='RGB Image',
    ))
    item.add_asset('thumbnail', pystac.Asset(
        href=f"s3://drone-imagery/{collection_id}/thumbs/{Path(image_path).stem}.jpg",
        media_type=pystac.MediaType.JPEG,
        roles=['thumbnail'],
    ))

    return item

# Create a STAC Collection for a drone survey
collection = pystac.Collection(
    id='forest-survey-2026-q1',
    title='Forest Survey Q1 2026',
    description='Quarterly forest health survey using DJI Mavic 3 Enterprise',
    extent=pystac.Extent(
        spatial=pystac.SpatialExtent(bboxes=[[-122.5, 37.7, -122.3, 37.9]]),
        temporal=pystac.TemporalExtent(intervals=[
            [datetime(2026, 1, 1, tzinfo=timezone.utc),
             datetime(2026, 3, 31, tzinfo=timezone.utc)]
        ]),
    ),
    license='proprietary',
    extra_fields={
        'drone:fleet_size': 12,
        'drone:total_missions': 340,
    }
)

print(json.dumps(collection.to_dict(), indent=2, default=str))`,
      },
      {
        id: "stac-api",
        title: "Building a STAC API with pgstac",
        type: "code",
        content:
          "The production STAC stack uses stac-fastapi with pgstac as the backend. pgstac is a PostgreSQL schema optimized for STAC search — it stores items as JSONB with spatial and temporal indexing for blazing-fast queries across millions of items.",
        language: "python",
        code: `# docker-compose.yml for STAC API stack
# docker-compose.yml
"""
version: '3.8'
services:
  database:
    image: ghcr.io/stac-utils/pgstac:v0.9.1
    environment:
      POSTGRES_USER: drone_stac
      POSTGRES_PASSWORD: \${PGSTAC_PASSWORD}
      POSTGRES_DB: drone_catalog
      PGUSER: drone_stac
    ports:
      - "5439:5432"
    volumes:
      - pgstac_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U drone_stac"]
      interval: 5s
      timeout: 5s
      retries: 5

  stac-api:
    image: ghcr.io/stac-utils/stac-fastapi-pgstac:v3.0.0
    environment:
      APP_HOST: 0.0.0.0
      APP_PORT: 8080
      POSTGRES_USER: drone_stac
      POSTGRES_PASS: \${PGSTAC_PASSWORD}
      POSTGRES_DBNAME: drone_catalog
      POSTGRES_HOST: database
      POSTGRES_PORT: 5432
    ports:
      - "8080:8080"
    depends_on:
      database:
        condition: service_healthy

volumes:
  pgstac_data:
"""

# ==============================================
# Python client: Ingest drone items into STAC API
# ==============================================
import httpx
from pathlib import Path
import asyncio

STAC_API_URL = "http://localhost:8080"

async def ingest_collection(collection_dict: dict):
    """Create or update a STAC collection."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{STAC_API_URL}/collections",
            json=collection_dict,
        )
        if resp.status_code == 409:  # already exists
            resp = await client.put(
                f"{STAC_API_URL}/collections/{collection_dict['id']}",
                json=collection_dict,
            )
        resp.raise_for_status()
        print(f"Collection '{collection_dict['id']}' ingested")

async def bulk_ingest_items(collection_id: str, items: list[dict],
                            batch_size: int = 500):
    """Bulk ingest STAC items using pgstac's bulk endpoint."""
    async with httpx.AsyncClient(timeout=60) as client:
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            feature_collection = {
                "type": "FeatureCollection",
                "features": batch,
            }
            resp = await client.post(
                f"{STAC_API_URL}/collections/{collection_id}/bulk_items",
                json={"items": {item["id"]: item for item in batch},
                       "method": "upsert"},
            )
            resp.raise_for_status()
            print(f"Ingested batch {i//batch_size + 1}: {len(batch)} items")

# ==============================================
# Search: Find thermal images near a fire report
# ==============================================
async def search_fire_images(lat: float, lon: float, radius_km: float = 5):
    """Search STAC catalog for thermal images near a fire report location."""
    # Convert radius to bbox
    from shapely.geometry import Point
    from shapely.ops import transform
    import pyproj
    pt = Point(lon, lat)
    # Buffer in meters, then convert back to WGS84
    proj_to_m = pyproj.Transformer.from_crs(4326, 3857, always_xy=True).transform
    proj_to_ll = pyproj.Transformer.from_crs(3857, 4326, always_xy=True).transform
    buffered = transform(proj_to_ll, transform(proj_to_m, pt).buffer(radius_km * 1000))
    bbox = list(buffered.bounds)

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{STAC_API_URL}/search", json={
            "bbox": bbox,
            "datetime": "2026-03-01T00:00:00Z/..",
            "collections": ["forest-survey-2026-q1"],
            "query": {
                "drone:altitude_m": {"gte": 50, "lte": 120},
                "gsd": {"lte": 5.0},  # max 5 cm/pixel
            },
            "sortby": [{"field": "datetime", "direction": "desc"}],
            "limit": 50,
        })
        results = resp.json()
        print(f"Found {results['numberReturned']} images near ({lat}, {lon})")
        return results['features']`,
      },
      {
        id: "stac-exercise",
        title: "Lab: End-to-End STAC Catalog for Drone Fleet",
        type: "exercise",
        content:
          "**Objective:** Deploy a complete STAC catalog system for a simulated drone fleet and build a search UI.\n\n**Tasks:**\n\n1. **Deploy the stack** — Use the docker-compose configuration to launch pgstac + stac-fastapi. Verify the API is running at `/`.\n\n2. **Generate synthetic data** — Create a Python script that generates 50,000 STAC items across 5 collections (forest-survey, powerline-inspection, construction-monitor, agriculture, search-rescue). Each item should have realistic coordinates, timestamps, GSD, altitude, and image type properties.\n\n3. **Bulk ingest** — Load all 50,000 items using the bulk ingest endpoint. Measure and report ingest throughput (items/second).\n\n4. **Implement search queries** — Write Python functions for these searches:\n   - All thermal images within 2km of coordinates, last 24 hours\n   - Images from a specific mission with GSD < 2cm\n   - Cross-collection search for any images covering a given polygon\n   - Time-series: images of a specific asset across all missions (for change detection)\n\n5. **Build a simple map UI** — Create an HTML/JS page using Leaflet.js that displays STAC search results on an interactive map. Clicking an image footprint shows its metadata and a thumbnail link.\n\n**Stretch goal:** Implement STAC's Filter extension (CQL2) to support complex property queries like `(gsd < 3) AND (drone:altitude_m > 80) AND (processing:level = 'L2')`.",
      },
    ],
    keyTakeaways: [
      "STAC provides a standardized way to catalog and search drone imagery by space, time, and properties",
      "The Catalog → Collection → Item hierarchy maps naturally to fleet → mission → image",
      "pgstac + stac-fastapi delivers production-grade performance for millions of spatiotemporal items",
      "STAC extensions (EO, view, processing) add domain-specific metadata without breaking the standard",
      "Bulk ingestion with JSONB storage and spatial indexing enables real-time catalog updates",
    ],
    resources: [
      { title: "STAC Specification", url: "https://stacspec.org/" },
      { title: "stac-fastapi (Python server)", url: "https://github.com/stac-utils/stac-fastapi" },
      { title: "pgstac (PostgreSQL STAC backend)", url: "https://github.com/stac-utils/pgstac" },
      { title: "PySTAC (Python library)", url: "https://pystac.readthedocs.io/" },
    ],
  },

  // ─── LESSON 3: Cloud Optimized GeoTIFFs (COGs) ───
  {
    lessonId: "cogs",
    trackId: "data-engineer",
    moduleId: "geoai",
    objectives: [
      "Understand the internal structure of GeoTIFF and COG formats (tiles, overviews, compression)",
      "Convert drone orthomosaics and rasters to Cloud Optimized GeoTIFFs",
      "Stream specific regions from multi-GB COG files without downloading the whole file",
      "Integrate COGs with ML training pipelines for efficient aerial data loading",
      "Serve COGs via HTTP range requests for web-based drone map viewers",
    ],
    prerequisites: [
      "Basic understanding of raster image formats (TIFF, JPEG)",
      "Familiarity with Python and numpy for array operations",
      "Experience with GDAL or rasterio (helpful but not required)",
    ],
    sections: [
      {
        id: "cog-intro",
        title: "The Problem with Large Drone Rasters",
        type: "theory",
        content:
          "Drone photogrammetry pipelines (OpenDroneMap, Pix4D, DJI Terra) produce massive orthomosaic images — a single survey can generate a 10-50GB GeoTIFF covering a few square kilometers at 2cm/pixel resolution. Traditional approaches require downloading the entire file before any analysis can begin. This creates bottlenecks across the pipeline:\n\n- An AI engineer needs a 512×512 crop around a detected anomaly, but must download 30GB to get those pixels\n- A web map viewer needs a zoomed-out overview, but the full-resolution data must be loaded first\n- A training pipeline needs random crops from across the mosaic, but file I/O dominates GPU training time\n\nCloud Optimized GeoTIFF (COG) solves all of these by reorganizing the internal structure of GeoTIFF files. A COG is still a valid GeoTIFF — any software that reads GeoTIFFs can read COGs. But the internal byte layout is optimized for HTTP range requests, enabling partial reads from cloud storage.\n\nThree key optimizations make COGs work:\n\n1. **Internal tiling**: Instead of storing pixels in row-major strips, COGs store data in tiles (typically 256×256 or 512×512). Each tile is independently addressable, so reading a small region only requires fetching the tiles that intersect it.\n\n2. **Overviews (pyramids)**: Downsampled versions of the full image at 2×, 4×, 8×, etc. reduction. A web map viewer at zoom level 10 reads the 8× overview (which is 64× smaller) instead of the full resolution.\n\n3. **Offset/length tables**: The IFD (Image File Directory) at the start of the file contains the byte offset and compressed size of every tile. A client reads this directory first (~10KB), then makes targeted range requests for specific tiles.\n\nWith COGs stored on S3 or GCS, an ML training pipeline can stream random crops from a 30GB mosaic with 50ms latency per crop, using only the network bandwidth needed for the actual pixels requested.",
      },
      {
        id: "cog-creation",
        title: "Creating COGs from Drone Orthomosaics",
        type: "code",
        content:
          "This script converts raw drone orthomosaics into optimized COGs with proper tiling, overviews, and compression. We use rasterio (Python binding for GDAL) with settings tuned for aerial imagery.",
        language: "python",
        code: `import rasterio
from rasterio.enums import Resampling
from rasterio.shutil import copy as rio_copy
from rasterio.transform import from_bounds
import numpy as np
from pathlib import Path
import subprocess

def create_cog(
    input_path: str,
    output_path: str,
    tile_size: int = 512,
    overview_levels: list[int] = [2, 4, 8, 16, 32],
    compression: str = "DEFLATE",
    predictor: int = 2,  # horizontal differencing for better compression
) -> dict:
    """Convert a GeoTIFF to Cloud Optimized GeoTIFF with overviews."""

    # Step 1: Add overviews to source file
    with rasterio.open(input_path, 'r+') as src:
        src.build_overviews(overview_levels, Resampling.lanczos)
        src.update_tags(ns='rio_overview', resampling='lanczos')

        print(f"Source: {src.width}x{src.height}, {src.count} bands, {src.dtypes[0]}")
        print(f"CRS: {src.crs}, Bounds: {src.bounds}")
        print(f"Overviews built: {overview_levels}")

    # Step 2: Create COG with optimal settings
    with rasterio.open(input_path) as src:
        profile = src.profile.copy()
        profile.update(
            driver='GTiff',
            tiled=True,
            blockxsize=tile_size,
            blockysize=tile_size,
            compress=compression,
            predictor=predictor,
            interleave='pixel',  # RGBRGB... ordering (better for pixel access)
            copy_src_overviews=True,
        )

        rio_copy(src, output_path, **profile)

    # Step 3: Validate COG
    result = validate_cog(output_path)

    # Report size savings
    orig_size = Path(input_path).stat().st_size / (1024**3)
    cog_size = Path(output_path).stat().st_size / (1024**3)
    print(f"Original: {orig_size:.2f} GB -> COG: {cog_size:.2f} GB "
          f"({(1-cog_size/orig_size)*100:.0f}% reduction)")

    return result

def validate_cog(filepath: str) -> dict:
    """Validate that a GeoTIFF is a valid COG."""
    with rasterio.open(filepath) as src:
        is_tiled = src.profile.get('tiled', False)
        has_overviews = len(src.overviews(1)) > 0
        block_shapes = src.block_shapes

    result = {
        'valid': is_tiled and has_overviews,
        'tiled': is_tiled,
        'has_overviews': has_overviews,
        'block_shapes': block_shapes,
    }
    print(f"COG Validation: {'PASS' if result['valid'] else 'FAIL'}")
    print(f"  Tiled: {is_tiled}, Overviews: {has_overviews}")
    return result

# Alternative: Use GDAL directly (faster for very large files)
def create_cog_gdal(input_path: str, output_path: str):
    """Use gdal_translate for COG creation (fastest method)."""
    cmd = [
        'gdal_translate', input_path, output_path,
        '-of', 'COG',
        '-co', 'COMPRESS=DEFLATE',
        '-co', 'PREDICTOR=YES',
        '-co', 'BLOCKSIZE=512',
        '-co', 'OVERVIEW_RESAMPLING=LANCZOS',
        '-co', 'OVERVIEW_COUNT=5',
        '-co', 'NUM_THREADS=ALL_CPUS',
        '-co', 'BIGTIFF=YES',  # needed for files > 4GB
    ]
    subprocess.run(cmd, check=True)
    print(f"COG created: {output_path}")`,
      },
      {
        id: "cog-streaming",
        title: "Streaming Pixels from COGs in ML Pipelines",
        type: "code",
        content:
          "The real power of COGs is streaming. This code shows how to read specific regions from a COG stored on S3 without downloading the whole file. This is how you build efficient ML data loaders for aerial imagery.",
        language: "python",
        code: `import rasterio
from rasterio.windows import Window, from_bounds
from rasterio.session import AWSSession
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader

# Configure rasterio for S3 access with HTTP range requests
AWS_SESSION = AWSSession(
    aws_access_key_id='...',
    aws_secret_access_key='...',
    region_name='us-west-2',
)

class COGDataset(Dataset):
    """PyTorch Dataset that streams crops from Cloud Optimized GeoTIFFs."""

    def __init__(self, cog_urls: list[str], crop_size: int = 512,
                 crops_per_image: int = 100, transform=None):
        self.cog_urls = cog_urls
        self.crop_size = crop_size
        self.crops_per_image = crops_per_image
        self.transform = transform

        # Pre-read COG metadata (only fetches IFD headers, ~10KB each)
        self.metas = []
        for url in cog_urls:
            with rasterio.Env(session=AWS_SESSION):
                with rasterio.open(url) as src:
                    self.metas.append({
                        'url': url,
                        'width': src.width,
                        'height': src.height,
                        'crs': src.crs,
                        'transform': src.transform,
                    })

    def __len__(self):
        return len(self.cog_urls) * self.crops_per_image

    def __getitem__(self, idx):
        img_idx = idx // self.crops_per_image
        meta = self.metas[img_idx]

        # Random crop location
        x = np.random.randint(0, meta['width'] - self.crop_size)
        y = np.random.randint(0, meta['height'] - self.crop_size)
        window = Window(x, y, self.crop_size, self.crop_size)

        # Stream only the needed tiles from S3 (typically 1-4 tile fetches)
        with rasterio.Env(session=AWS_SESSION, GDAL_DISABLE_READDIR_ON_OPEN='EMPTY_DIR'):
            with rasterio.open(meta['url']) as src:
                data = src.read(window=window)  # (C, H, W) numpy array

        # Convert to float tensor
        tensor = torch.from_numpy(data.astype(np.float32)) / 255.0

        if self.transform:
            tensor = self.transform(tensor)

        return tensor

# Usage: efficient training on drone orthomosaics stored as COGs
cog_files = [
    "s3://drone-imagery/mosaics/forest-survey-001.tif",
    "s3://drone-imagery/mosaics/forest-survey-002.tif",
    "s3://drone-imagery/mosaics/powerline-inspection-001.tif",
]

dataset = COGDataset(cog_files, crop_size=512, crops_per_image=200)
loader = DataLoader(dataset, batch_size=16, num_workers=8, pin_memory=True)

# Each batch streams ~16 x 512x512 crops from S3
# Network I/O: ~16 x 512 x 512 x 3 x 1 byte = ~12MB per batch
# vs downloading full files: potentially hundreds of GB
for batch in loader:
    print(f"Batch shape: {batch.shape}")  # (16, 3, 512, 512)
    # model_output = model(batch.cuda())
    break

# ─── Window read by geographic coordinates ───
def read_region_by_coords(cog_url: str, lon: float, lat: float,
                          size_m: float = 100) -> np.ndarray:
    """Read a region from a COG by geographic coordinates."""
    with rasterio.Env(session=AWS_SESSION):
        with rasterio.open(cog_url) as src:
            # Convert geographic extent to pixel window
            half = size_m / 2
            window = from_bounds(
                lon - half/111320, lat - half/110540,
                lon + half/111320, lat + half/110540,
                src.transform
            )
            data = src.read(window=window)
    return data`,
      },
      {
        id: "cog-exercise",
        title: "Lab: COG Pipeline for Drone Surveys",
        type: "exercise",
        content:
          "**Objective:** Build an end-to-end COG pipeline that converts drone survey outputs to cloud-optimized format and serves them through a tile server.\n\n1. **Convert sample orthomosaics** — Download 3 sample GeoTIFFs from OpenAerialMap and convert them to COGs with multiple overview levels. Compare file sizes and validate.\n\n2. **Build a tile server** — Create a FastAPI service using `titiler` that serves dynamic tiles from COG files. Support zoom-level-appropriate overview selection and dynamic band math (NDVI from multispectral COGs).\n\n3. **ML data loader benchmark** — Implement the COGDataset class and benchmark: (a) random crop throughput from local COGs vs (b) raw GeoTIFF sequential reads. Target: 500+ crops/second from local SSD.\n\n4. **Integration with STAC** — Add COG asset links to STAC items and implement a pipeline that: receives a STAC search result → extracts COG URLs → streams crops for inference.\n\n**Deliverables:** COG conversion script, tile server API, benchmark results comparing COG streaming vs full file loading.",
      },
    ],
    keyTakeaways: [
      "COGs are regular GeoTIFFs reorganized for efficient partial reads via HTTP range requests",
      "Internal tiling + overviews + offset tables enable streaming any region of a multi-GB raster",
      "ML training pipelines can stream random crops from cloud-stored COGs with minimal latency",
      "GDAL's COG driver handles overview generation, compression, and tiling in a single step",
      "COGs integrate naturally with STAC catalogs — each STAC item links to its COG asset",
    ],
    resources: [
      { title: "COG Specification", url: "https://www.cogeo.org/" },
      { title: "Rasterio Documentation", url: "https://rasterio.readthedocs.io/" },
      { title: "TiTiler (COG Tile Server)", url: "https://developmentseed.org/titiler/" },
      { title: "GDAL COG Driver", url: "https://gdal.org/drivers/raster/cog.html" },
    ],
  },

  // ─── LESSON 4: LiDAR Processing ───
  {
    lessonId: "lidar",
    trackId: "data-engineer",
    moduleId: "sensor-fusion",
    objectives: [
      "Understand LiDAR point cloud data formats (LAS/LAZ, PLY) and their properties",
      "Filter noise and outliers from drone LiDAR scans using statistical and radius-based methods",
      "Perform point cloud registration (ICP) to align overlapping scans",
      "Extract ground surfaces using cloth simulation filtering (CSF)",
      "Build 3D mesh models from processed point clouds for terrain analysis",
    ],
    prerequisites: [
      "Basic 3D geometry concepts (points, normals, transformations)",
      "Familiarity with numpy for array operations",
      "Understanding of coordinate systems and projections",
    ],
    sections: [
      {
        id: "lidar-intro",
        title: "LiDAR for Drone Surveys: Data Characteristics",
        type: "theory",
        content:
          "Light Detection and Ranging (LiDAR) sensors mounted on drones emit hundreds of thousands of laser pulses per second, measuring the time-of-flight for each pulse to compute precise 3D coordinates. Unlike camera imagery that captures 2D projections, LiDAR directly measures the 3D structure of the environment.\n\nA typical drone LiDAR sensor (Livox Mid-360, DJI Zenmuse L2, or RIEGL miniVUX) produces point clouds with these characteristics:\n\n- **Point density**: 100-500 points per square meter at 50m altitude\n- **Accuracy**: 2-5cm horizontal, 1-3cm vertical\n- **Returns**: Multiple returns per pulse (first return = canopy top, last return = ground surface)\n- **Attributes per point**: X, Y, Z, intensity, return number, GPS time, classification\n- **Data volume**: 10-50 million points per minute of flight, 500MB-2GB per mission\n\nThe raw point cloud from a drone LiDAR is messy. GPS drift, IMU noise, multi-path reflections, and atmospheric effects introduce systematic and random errors. Processing steps include:\n\n1. **Noise filtering**: Remove statistical outliers and isolated points\n2. **Ground classification**: Separate ground points from vegetation, buildings, and objects\n3. **Registration**: Align overlapping flight strips using point-to-plane ICP (Iterative Closest Point)\n4. **Georeferencing**: Apply GPS/IMU corrections for absolute positioning\n5. **Feature extraction**: Derive terrain models (DTM), surface models (DSM), canopy height models (CHM)\n\nFor AI applications, processed LiDAR point clouds serve as training data for 3D object detection, terrain-aware path planning, and structure mapping — capabilities impossible with camera imagery alone.",
      },
      {
        id: "lidar-processing",
        title: "Point Cloud Processing with Open3D",
        type: "code",
        content:
          "This pipeline covers the essential LiDAR processing steps: loading data, filtering noise, downsampling, normal estimation, and registration. Open3D provides efficient C++ implementations accessible through Python.",
        language: "python",
        code: `import open3d as o3d
import numpy as np
import laspy
from pathlib import Path

# ─── Step 1: Load LAS/LAZ point cloud ───
def load_las_to_o3d(las_path: str) -> o3d.geometry.PointCloud:
    """Load a LAS/LAZ file into Open3D point cloud."""
    las = laspy.read(las_path)
    points = np.vstack([las.x, las.y, las.z]).T

    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)

    # Add intensity as color (grayscale)
    if hasattr(las, 'intensity'):
        intensity = las.intensity / las.intensity.max()
        colors = np.column_stack([intensity, intensity, intensity])
        pcd.colors = o3d.utility.Vector3dVector(colors)

    # Store classification if available
    if hasattr(las, 'classification'):
        pcd.classification = las.classification

    print(f"Loaded {len(points):,} points from {las_path}")
    return pcd

# ─── Step 2: Statistical Outlier Removal ───
def remove_noise(pcd: o3d.geometry.PointCloud,
                 nb_neighbors: int = 20,
                 std_ratio: float = 2.0) -> o3d.geometry.PointCloud:
    """Remove statistical outliers (noise points far from neighbors)."""
    clean, mask = pcd.remove_statistical_outlier(
        nb_neighbors=nb_neighbors,
        std_ratio=std_ratio
    )
    removed = len(pcd.points) - len(clean.points)
    print(f"Removed {removed:,} noise points ({removed/len(pcd.points)*100:.1f}%)")
    return clean

# ─── Step 3: Voxel Downsampling ───
def downsample(pcd: o3d.geometry.PointCloud,
               voxel_size: float = 0.1) -> o3d.geometry.PointCloud:
    """Downsample point cloud using voxel grid (one point per voxel)."""
    down = pcd.voxel_down_sample(voxel_size)
    print(f"Downsampled: {len(pcd.points):,} -> {len(down.points):,} points "
          f"(voxel: {voxel_size}m)")
    return down

# ─── Step 4: Normal Estimation ───
def estimate_normals(pcd: o3d.geometry.PointCloud,
                     radius: float = 0.5,
                     max_nn: int = 30) -> o3d.geometry.PointCloud:
    """Estimate point normals using local plane fitting."""
    pcd.estimate_normals(
        search_param=o3d.geometry.KDTreeSearchParamHybrid(
            radius=radius, max_nn=max_nn
        )
    )
    # Orient normals consistently (pointing upward for terrain)
    pcd.orient_normals_towards_camera_location(
        camera_location=np.array([0, 0, 1000])  # assume sensor above
    )
    print(f"Normals estimated for {len(pcd.points):,} points")
    return pcd

# ─── Step 5: Point-to-Plane ICP Registration ───
def register_point_clouds(source: o3d.geometry.PointCloud,
                          target: o3d.geometry.PointCloud,
                          max_distance: float = 0.5,
                          max_iterations: int = 50
                          ) -> tuple:
    """Align two overlapping point clouds using ICP."""
    # Initial alignment using FPFH features
    source_down = downsample(source, 0.5)
    target_down = downsample(target, 0.5)
    estimate_normals(source_down)
    estimate_normals(target_down)

    # FPFH feature extraction
    source_fpfh = o3d.pipelines.registration.compute_fpfh_feature(
        source_down,
        o3d.geometry.KDTreeSearchParamHybrid(radius=2.5, max_nn=100)
    )
    target_fpfh = o3d.pipelines.registration.compute_fpfh_feature(
        target_down,
        o3d.geometry.KDTreeSearchParamHybrid(radius=2.5, max_nn=100)
    )

    # RANSAC global registration (coarse alignment)
    ransac = o3d.pipelines.registration.registration_ransac_based_on_feature_matching(
        source_down, target_down, source_fpfh, target_fpfh,
        mutual_filter=True,
        max_correspondence_distance=2.0,
        estimation_method=o3d.pipelines.registration.TransformationEstimationPointToPoint(),
        ransac_n=3,
        criteria=o3d.pipelines.registration.RANSACConvergenceCriteria(100000, 0.999),
    )

    # Point-to-Plane ICP refinement
    icp = o3d.pipelines.registration.registration_icp(
        source, target,
        max_correspondence_distance=max_distance,
        init=ransac.transformation,
        estimation_method=o3d.pipelines.registration.TransformationEstimationPointToPlane(),
        criteria=o3d.pipelines.registration.ICPConvergenceCriteria(
            max_iteration=max_iterations
        ),
    )

    print(f"ICP Fitness: {icp.fitness:.4f}, RMSE: {icp.inlier_rmse:.4f}m")
    aligned = source.transform(icp.transformation)
    return aligned, icp.transformation

# ─── Step 6: Ground Classification (CSF) ───
def classify_ground(pcd: o3d.geometry.PointCloud,
                    cloth_resolution: float = 0.5,
                    threshold: float = 0.5) -> tuple:
    """Classify ground vs non-ground using Cloth Simulation Filter."""
    import CSF  # pip install cloth-simulation-filter

    csf = CSF.CSF()
    csf.params.bSloopSmooth = False
    csf.params.cloth_resolution = cloth_resolution
    csf.params.rigidness = 1  # 1=flat, 2=gentle slope, 3=steep slope
    csf.params.time_step = 0.65
    csf.params.class_threshold = threshold
    csf.params.interations = 500

    points = np.asarray(pcd.points)
    csf.setPointCloud(points)
    ground_idx = CSF.VecInt()
    non_ground_idx = CSF.VecInt()
    csf.do_filtering(ground_idx, non_ground_idx)

    ground_pcd = pcd.select_by_index(list(ground_idx))
    non_ground_pcd = pcd.select_by_index(list(non_ground_idx))

    print(f"Ground: {len(ground_idx):,}, Non-ground: {len(non_ground_idx):,}")
    return ground_pcd, non_ground_pcd

# ─── Full Pipeline ───
def process_lidar_scan(las_path: str, output_dir: str):
    """Complete LiDAR processing pipeline."""
    pcd = load_las_to_o3d(las_path)
    pcd = remove_noise(pcd, nb_neighbors=20, std_ratio=2.0)
    pcd = downsample(pcd, voxel_size=0.05)  # 5cm resolution
    pcd = estimate_normals(pcd)
    ground, objects = classify_ground(pcd)

    # Save results
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    o3d.io.write_point_cloud(str(out / "clean.ply"), pcd)
    o3d.io.write_point_cloud(str(out / "ground.ply"), ground)
    o3d.io.write_point_cloud(str(out / "objects.ply"), objects)

    print(f"Pipeline complete. Results in {output_dir}")

process_lidar_scan("data/drone_scan_001.laz", "output/scan_001")`,
      },
      {
        id: "lidar-terrain",
        title: "Building Terrain Models from LiDAR",
        type: "code",
        content:
          "After ground classification, we build Digital Terrain Models (DTM) and Digital Surface Models (DSM). These rasters are essential inputs for drone path planning, flood modeling, and forestry analysis.",
        language: "python",
        code: `import numpy as np
import rasterio
from rasterio.transform import from_origin
from scipy.interpolate import griddata
from scipy.ndimage import median_filter

def create_dtm(ground_points: np.ndarray,
               resolution: float = 0.5,
               output_path: str = "dtm.tif") -> str:
    """Create a Digital Terrain Model raster from classified ground points."""
    x, y, z = ground_points[:, 0], ground_points[:, 1], ground_points[:, 2]

    # Define raster grid
    x_min, x_max = x.min(), x.max()
    y_min, y_max = y.min(), y.max()
    cols = int((x_max - x_min) / resolution)
    rows = int((y_max - y_min) / resolution)

    xi = np.linspace(x_min, x_max, cols)
    yi = np.linspace(y_max, y_min, rows)  # y-axis flipped for raster
    grid_x, grid_y = np.meshgrid(xi, yi)

    # Interpolate ground surface
    dtm = griddata(
        (x, y), z,
        (grid_x, grid_y),
        method='linear',
        fill_value=np.nan
    )

    # Fill remaining NaN with nearest neighbor
    mask = np.isnan(dtm)
    if mask.any():
        dtm_nn = griddata((x, y), z, (grid_x, grid_y), method='nearest')
        dtm[mask] = dtm_nn[mask]

    # Smooth to remove interpolation artifacts
    dtm = median_filter(dtm, size=3)

    # Save as GeoTIFF
    transform = from_origin(x_min, y_max, resolution, resolution)
    with rasterio.open(
        output_path, 'w',
        driver='GTiff',
        height=rows, width=cols,
        count=1, dtype='float32',
        crs='EPSG:32610',  # UTM Zone 10N (adjust per location)
        transform=transform,
        compress='deflate',
    ) as dst:
        dst.write(dtm.astype(np.float32), 1)
        dst.set_band_description(1, 'Elevation (m)')

    print(f"DTM created: {cols}x{rows} @ {resolution}m/px -> {output_path}")
    return output_path

def create_chm(dsm_path: str, dtm_path: str, output_path: str = "chm.tif"):
    """Create Canopy Height Model = DSM - DTM."""
    with rasterio.open(dsm_path) as dsm_src, rasterio.open(dtm_path) as dtm_src:
        dsm = dsm_src.read(1)
        dtm = dtm_src.read(1)

        chm = dsm - dtm
        chm = np.clip(chm, 0, None)  # heights can't be negative

        profile = dsm_src.profile.copy()
        with rasterio.open(output_path, 'w', **profile) as dst:
            dst.write(chm, 1)
            dst.set_band_description(1, 'Canopy Height (m)')

    print(f"CHM created: height range {chm[chm>0].min():.1f} - {chm.max():.1f}m")
    return output_path`,
      },
      {
        id: "lidar-exercise",
        title: "Lab: Full LiDAR Processing Pipeline",
        type: "exercise",
        content:
          "**Objective:** Process a drone LiDAR dataset end-to-end, from raw point cloud to terrain models and 3D visualization.\n\n1. **Download sample data** — Get a drone LiDAR dataset from OpenTopography or the USGS 3DEP program. Choose a vegetated area with terrain variation.\n\n2. **Process the point cloud** — Apply the full pipeline: noise removal → downsampling → normal estimation → ground classification. Visualize each step in Open3D's viewer.\n\n3. **Register multiple strips** — If multiple flight strips are available, align them using ICP. Measure registration accuracy (RMSE).\n\n4. **Generate terrain products** — Create DTM, DSM, and CHM rasters at 25cm resolution. Convert to COGs for serving.\n\n5. **3D visualization** — Build a simple web viewer using Three.js or Potree that displays the processed point cloud with classification coloring (ground=brown, vegetation=green, buildings=red).\n\n**Deliverables:** Processed PLY files, DTM/DSM/CHM GeoTIFFs, pipeline metrics (point counts, RMSE, processing time), and a web viewer.",
      },
    ],
    keyTakeaways: [
      "Drone LiDAR produces dense 3D point clouds requiring systematic noise removal and filtering",
      "Point-to-Plane ICP with FPFH feature pre-alignment provides robust registration of overlapping scans",
      "Cloth Simulation Filter (CSF) effectively separates ground points from vegetation and structures",
      "DTM, DSM, and CHM rasters derived from LiDAR are essential for terrain analysis and AI training",
      "Open3D + laspy provide a complete Python toolkit for LiDAR processing at production scale",
    ],
    resources: [
      { title: "Open3D Documentation", url: "http://www.open3d.org/docs/" },
      { title: "laspy (LAS/LAZ Python library)", url: "https://laspy.readthedocs.io/" },
      { title: "PDAL (Point Data Abstraction Library)", url: "https://pdal.io/" },
      { title: "OpenTopography (Sample LiDAR Data)", url: "https://opentopography.org/" },
    ],
  },

  // ─── LESSON 5: Telemetry Syncing ───
  {
    lessonId: "telemetry",
    trackId: "data-engineer",
    moduleId: "sensor-fusion",
    objectives: [
      "Parse MAVLink telemetry logs from PX4/ArduPilot flight controllers",
      "Synchronize multi-rate sensor streams (100Hz IMU, 10Hz GPS, 2Hz camera) using timestamp interpolation",
      "Implement sensor fusion using Extended Kalman Filter for precise positioning",
      "Build a real-time telemetry pipeline using Apache Kafka or Redis Streams",
      "Create a unified sensor timeline for training data labeling",
    ],
    prerequisites: [
      "Understanding of time-series data concepts",
      "Basic signal processing (sampling, interpolation)",
      "Familiarity with Python pandas for data manipulation",
    ],
    sections: [
      {
        id: "telemetry-intro",
        title: "The Multi-Rate Sensor Challenge",
        type: "theory",
        content:
          "A drone in flight is a symphony of sensors, each operating at its own frequency:\n\n- **IMU (Inertial Measurement Unit)**: 100-400Hz — accelerometer and gyroscope readings\n- **GPS**: 5-20Hz — latitude, longitude, altitude (with 1-3m accuracy)\n- **Barometer**: 50Hz — altitude via atmospheric pressure\n- **Magnetometer**: 50Hz — heading via Earth's magnetic field\n- **Camera shutter**: 0.5-5Hz — image capture events\n- **LiDAR**: 100,000-300,000 points/sec — 3D measurements\n- **Thermal camera**: 9-30Hz — infrared frames\n- **Battery/ESC**: 10Hz — voltage, current, motor RPM\n\nThe fundamental challenge is alignment: when the camera takes a photo at t=12.345s, where exactly was the drone? The GPS might report position at t=12.300s and t=12.400s, but not at exactly t=12.345s. The IMU has readings at 100Hz, but these are relative measurements (acceleration, rotation rate) that drift over time.\n\nMAVLink is the standard telemetry protocol for PX4 and ArduPilot. It defines message types for every sensor and system status. Flight logs (`.ulg` for PX4, `.bin` for ArduPilot) contain all MAVLink messages with microsecond timestamps. Parsing these logs correctly — handling clock synchronization, message dropouts, and coordinate frame conversions — is essential for creating accurate training datasets.\n\nFor AI training data, every image needs a precise 6-DOF pose (x, y, z, roll, pitch, yaw). This requires interpolating between GPS fixes, fusing with IMU data for sub-centimeter relative accuracy, and time-stamping against the camera trigger signal. Get this wrong, and your ground truth labels will be spatially misaligned — a silent accuracy killer.",
      },
      {
        id: "telemetry-parsing",
        title: "Parsing MAVLink Telemetry Logs",
        type: "code",
        content:
          "This code parses PX4 flight logs (.ulg format) and ArduPilot logs to extract synchronized telemetry streams. We extract the key sensor data (GPS, attitude, camera triggers) into a unified pandas DataFrame.",
        language: "python",
        code: `import pandas as pd
import numpy as np
from pyulog import ULog
from datetime import datetime, timezone
from pathlib import Path

class FlightLogParser:
    """Parse PX4 ULog files into synchronized sensor DataFrames."""

    def __init__(self, ulog_path: str):
        self.ulog = ULog(ulog_path)
        self.start_time = self.ulog.start_timestamp / 1e6  # microseconds to seconds
        print(f"Flight log: {Path(ulog_path).name}")
        print(f"Duration: {(self.ulog.last_timestamp - self.ulog.start_timestamp)/1e6:.1f}s")
        print(f"Messages: {[d.name for d in self.ulog.data_list]}")

    def get_gps(self) -> pd.DataFrame:
        """Extract GPS positions at native rate (~10Hz)."""
        gps = self.ulog.get_dataset('vehicle_gps_position')
        df = pd.DataFrame({
            'timestamp': gps.data['timestamp'] / 1e6,  # to seconds
            'lat': gps.data['latitude_deg'],
            'lon': gps.data['longitude_deg'],
            'alt_msl': gps.data['altitude_msl_m'],
            'alt_agl': gps.data.get('altitude_ellipsoid_m',
                                     gps.data['altitude_msl_m']),
            'speed_m_s': np.sqrt(gps.data['vel_n_m_s']**2 +
                                  gps.data['vel_e_m_s']**2),
            'hdop': gps.data['hdop'],
            'satellites': gps.data['satellites_used'],
        })
        return df.set_index('timestamp')

    def get_attitude(self) -> pd.DataFrame:
        """Extract attitude (orientation) at high rate (~100Hz)."""
        att = self.ulog.get_dataset('vehicle_attitude')
        # Quaternion to Euler conversion
        q0 = att.data['q[0]']
        q1 = att.data['q[1]']
        q2 = att.data['q[2]']
        q3 = att.data['q[3]']

        roll = np.arctan2(2*(q0*q1 + q2*q3), 1 - 2*(q1**2 + q2**2))
        pitch = np.arcsin(np.clip(2*(q0*q2 - q3*q1), -1, 1))
        yaw = np.arctan2(2*(q0*q3 + q1*q2), 1 - 2*(q2**2 + q3**2))

        df = pd.DataFrame({
            'timestamp': att.data['timestamp'] / 1e6,
            'roll_deg': np.degrees(roll),
            'pitch_deg': np.degrees(pitch),
            'yaw_deg': np.degrees(yaw),
        })
        return df.set_index('timestamp')

    def get_camera_triggers(self) -> pd.DataFrame:
        """Extract camera trigger events with sequence number."""
        try:
            cam = self.ulog.get_dataset('camera_trigger')
            df = pd.DataFrame({
                'timestamp': cam.data['timestamp'] / 1e6,
                'seq': cam.data['seq'],
                'feedback': cam.data.get('feedback', np.ones(len(cam.data['seq']))),
            })
            return df.set_index('timestamp')
        except Exception:
            print("No camera_trigger messages found")
            return pd.DataFrame()

    def get_battery(self) -> pd.DataFrame:
        """Extract battery telemetry."""
        bat = self.ulog.get_dataset('battery_status')
        df = pd.DataFrame({
            'timestamp': bat.data['timestamp'] / 1e6,
            'voltage_v': bat.data['voltage_v'],
            'current_a': bat.data['current_a'],
            'remaining_pct': bat.data['remaining'] * 100,
        })
        return df.set_index('timestamp')

# Parse flight log
parser = FlightLogParser("data/flight_2026-03-15.ulg")
gps_df = parser.get_gps()
att_df = parser.get_attitude()
cam_df = parser.get_camera_triggers()
bat_df = parser.get_battery()

print(f"GPS: {len(gps_df)} samples ({1/gps_df.index.diff().median():.0f}Hz)")
print(f"Attitude: {len(att_df)} samples ({1/att_df.index.diff().median():.0f}Hz)")
print(f"Camera triggers: {len(cam_df)} events")`,
      },
      {
        id: "telemetry-sync",
        title: "Timestamp Interpolation and Sensor Alignment",
        type: "code",
        content:
          "The critical step: aligning multi-rate sensor streams to precise camera trigger timestamps. We use interpolation to compute exact GPS position and attitude at the moment each photo was taken.",
        language: "python",
        code: `import pandas as pd
import numpy as np
from scipy.interpolate import interp1d

class SensorSynchronizer:
    """Synchronize multi-rate sensor streams to target timestamps."""

    def __init__(self, gps_df: pd.DataFrame, attitude_df: pd.DataFrame,
                 camera_df: pd.DataFrame):
        self.gps = gps_df
        self.attitude = attitude_df
        self.camera = camera_df

    def interpolate_to_camera(self) -> pd.DataFrame:
        """Interpolate all sensor data to camera trigger timestamps."""
        target_times = self.camera.index.values

        # Interpolate GPS (10Hz -> camera rate)
        gps_interp = {}
        for col in ['lat', 'lon', 'alt_msl', 'speed_m_s']:
            f = interp1d(
                self.gps.index.values,
                self.gps[col].values,
                kind='cubic',  # smooth interpolation
                fill_value='extrapolate',
                bounds_error=False,
            )
            gps_interp[col] = f(target_times)

        # Interpolate attitude (100Hz -> camera rate)
        att_interp = {}
        for col in ['roll_deg', 'pitch_deg', 'yaw_deg']:
            f = interp1d(
                self.attitude.index.values,
                self.attitude[col].values,
                kind='linear',  # linear ok for high-rate data
                fill_value='extrapolate',
                bounds_error=False,
            )
            att_interp[col] = f(target_times)

        # Combine into unified DataFrame
        synced = pd.DataFrame({
            'timestamp': target_times,
            'image_seq': self.camera['seq'].values,
            **gps_interp,
            **att_interp,
        })

        # Quality flags
        synced['gps_gap_s'] = self._nearest_gap(target_times, self.gps.index.values)
        synced['att_gap_s'] = self._nearest_gap(target_times, self.attitude.index.values)
        synced['quality'] = np.where(
            (synced['gps_gap_s'] < 0.5) & (synced['att_gap_s'] < 0.1),
            'good', 'suspect'
        )

        return synced.set_index('timestamp')

    @staticmethod
    def _nearest_gap(targets, sources):
        """Compute time gap to nearest source sample for each target."""
        idx = np.searchsorted(sources, targets)
        idx = np.clip(idx, 1, len(sources) - 1)
        gaps = np.minimum(
            np.abs(targets - sources[idx]),
            np.abs(targets - sources[idx - 1])
        )
        return gaps

    def create_image_metadata(self, synced_df: pd.DataFrame,
                              image_dir: str) -> list[dict]:
        """Create image metadata records linking each photo to its pose."""
        records = []
        for _, row in synced_df.iterrows():
            records.append({
                'image_file': f"{image_dir}/IMG_{int(row['image_seq']):05d}.jpg",
                'latitude': row['lat'],
                'longitude': row['lon'],
                'altitude_m': row['alt_msl'],
                'roll_deg': row['roll_deg'],
                'pitch_deg': row['pitch_deg'],
                'yaw_deg': row['yaw_deg'],
                'speed_m_s': row['speed_m_s'],
                'quality': row['quality'],
                'gps_gap_s': row['gps_gap_s'],
            })
        return records

# Usage
sync = SensorSynchronizer(gps_df, att_df, cam_df)
synced = sync.interpolate_to_camera()
print(f"Synced {len(synced)} images")
print(f"Quality: {(synced['quality']=='good').sum()} good, "
      f"{(synced['quality']=='suspect').sum()} suspect")
print(synced[['lat', 'lon', 'alt_msl', 'roll_deg', 'pitch_deg', 'yaw_deg']].head())`,
      },
      {
        id: "telemetry-pipeline",
        title: "Real-time Telemetry Pipeline",
        type: "code",
        content:
          "For live drone operations, telemetry must be processed in real-time. This pipeline uses Redis Streams to ingest MAVLink messages and compute synchronized state updates at 10Hz for the GCS (Ground Control Station).",
        language: "python",
        code: `import asyncio
import json
import redis.asyncio as redis
from dataclasses import dataclass, asdict
from collections import deque
import numpy as np

@dataclass
class DroneState:
    """Unified drone state computed from fused telemetry."""
    timestamp: float
    lat: float
    lon: float
    alt_msl: float
    alt_agl: float
    roll_deg: float
    pitch_deg: float
    yaw_deg: float
    speed_m_s: float
    battery_pct: float
    satellites: int
    mode: str

class TelemetryPipeline:
    """Real-time telemetry fusion using Redis Streams."""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
        self.gps_buffer = deque(maxlen=100)
        self.att_buffer = deque(maxlen=500)
        self.bat_latest = {'voltage': 0, 'remaining': 0}

    async def ingest_mavlink(self, stream_key: str = "drone:telemetry"):
        """Read MAVLink messages from Redis Stream and route to buffers."""
        last_id = '0-0'
        while True:
            messages = await self.redis.xread(
                {stream_key: last_id}, count=100, block=50
            )
            for stream, entries in messages:
                for msg_id, data in entries:
                    last_id = msg_id
                    msg_type = data[b'type'].decode()

                    if msg_type == 'GPS_RAW_INT':
                        self.gps_buffer.append({
                            't': float(data[b'timestamp']),
                            'lat': int(data[b'lat']) / 1e7,
                            'lon': int(data[b'lon']) / 1e7,
                            'alt': int(data[b'alt']) / 1000,
                        })
                    elif msg_type == 'ATTITUDE':
                        self.att_buffer.append({
                            't': float(data[b'timestamp']),
                            'roll': float(data[b'roll']),
                            'pitch': float(data[b'pitch']),
                            'yaw': float(data[b'yaw']),
                        })
                    elif msg_type == 'BATTERY_STATUS':
                        self.bat_latest = {
                            'voltage': float(data[b'voltage']) / 1000,
                            'remaining': int(data[b'remaining']),
                        }

    async def compute_state(self, output_stream: str = "drone:state",
                            rate_hz: float = 10):
        """Compute fused drone state at fixed rate and publish."""
        interval = 1.0 / rate_hz
        while True:
            now = asyncio.get_event_loop().time()

            if len(self.gps_buffer) >= 2 and len(self.att_buffer) >= 2:
                # Latest GPS
                gps = self.gps_buffer[-1]
                # Latest attitude
                att = self.att_buffer[-1]

                state = DroneState(
                    timestamp=now,
                    lat=gps['lat'],
                    lon=gps['lon'],
                    alt_msl=gps['alt'],
                    alt_agl=gps['alt'],  # would subtract terrain elevation
                    roll_deg=np.degrees(att['roll']),
                    pitch_deg=np.degrees(att['pitch']),
                    yaw_deg=np.degrees(att['yaw']),
                    speed_m_s=0.0,  # computed from GPS deltas
                    battery_pct=self.bat_latest['remaining'],
                    satellites=0,
                    mode='AUTO',
                )

                # Publish fused state
                await self.redis.xadd(
                    output_stream,
                    {k: str(v) for k, v in asdict(state).items()},
                    maxlen=1000,  # keep last 1000 states
                )

            await asyncio.sleep(interval)

    async def run(self):
        """Run ingestion and state computation concurrently."""
        await asyncio.gather(
            self.ingest_mavlink(),
            self.compute_state(),
        )

# Launch pipeline
# pipeline = TelemetryPipeline()
# asyncio.run(pipeline.run())`,
      },
      {
        id: "telemetry-exercise",
        title: "Lab: Build a Telemetry Sync Pipeline",
        type: "exercise",
        content:
          "**Objective:** Build a complete telemetry processing pipeline that ingests drone flight logs, synchronizes multi-rate sensors, and produces georeferenced image metadata.\n\n1. **Parse a PX4 flight log** — Download a sample .ulg file from the PX4 Flight Review website. Extract GPS, attitude, camera trigger, and battery data into DataFrames.\n\n2. **Visualize sensor rates** — Plot the timeline showing data sample distribution for each sensor. Identify gaps, dropouts, and timing issues.\n\n3. **Synchronize to camera triggers** — Interpolate all sensors to camera timestamps. Flag images where interpolation quality is poor (GPS gap > 1s).\n\n4. **Export georeferenced data** — Create a CSV with image filename, lat, lon, altitude, roll, pitch, yaw for import into photogrammetry software (ODM, Pix4D).\n\n5. **Quality dashboard** — Build a simple dashboard (Streamlit or Jupyter) showing: flight path on map, sensor coverage timeline, interpolation quality distribution, battery drain curve.\n\n**Deliverables:** Python pipeline script, georeferenced image CSV, quality dashboard, analysis report.",
      },
    ],
    keyTakeaways: [
      "Drone sensors operate at different rates — synchronization via timestamp interpolation is essential",
      "PX4 ULog files contain all MAVLink messages with microsecond timestamps for precise alignment",
      "Cubic interpolation for GPS and linear for attitude provide smooth, accurate pose estimation",
      "Quality flags help identify images with poor telemetry coverage that may have inaccurate geolocation",
      "Real-time pipelines using Redis Streams enable live telemetry fusion for ground control systems",
    ],
    resources: [
      { title: "PX4 ULog Format", url: "https://docs.px4.io/main/en/dev_log/ulog_file_format.html" },
      { title: "pyulog (Python ULog parser)", url: "https://github.com/PX4/pyulog" },
      { title: "MAVLink Protocol", url: "https://mavlink.io/en/" },
      { title: "PX4 Flight Review (sample logs)", url: "https://review.px4.io/" },
    ],
  },

  // ─── LESSON 6: Active Learning Pipelines ───
  {
    lessonId: "active-learning",
    trackId: "data-engineer",
    moduleId: "labeling",
    objectives: [
      "Understand active learning strategies (uncertainty, diversity, query-by-committee)",
      "Build an automated pipeline that identifies low-confidence model predictions for human review",
      "Integrate with CVAT and Labelbox APIs for programmatic labeling task creation",
      "Implement a continuous learning loop: train → predict → identify uncertainty → label → retrain",
      "Measure labeling efficiency gains compared to random sampling",
    ],
    prerequisites: [
      "Experience with training image classification or object detection models",
      "Familiarity with Python REST API clients (requests or httpx)",
      "Understanding of model confidence scores and prediction probabilities",
    ],
    sections: [
      {
        id: "al-intro",
        title: "Why Active Learning for Drone Data",
        type: "theory",
        content:
          "Labeling drone imagery is expensive. A single overhead image may contain hundreds of objects (trees, vehicles, buildings, people, power lines), and each needs a precise bounding box or segmentation mask. At $0.10-0.50 per annotation, labeling 100,000 images can cost $50,000-500,000 and take weeks.\n\nActive learning reduces this cost by 60-80% through intelligent sample selection. Instead of randomly labeling images, we use the model itself to identify which images would be most valuable to label — typically those where the model is least confident or most confused.\n\nThree core strategies:\n\n**1. Uncertainty Sampling**: Select images where the model's predictions have the lowest confidence. If a fire detection model outputs probability 0.51 for 'smoke' (barely above threshold), that image is highly informative — the model can't decide, so a human label will provide maximum learning signal.\n\n**2. Diversity Sampling**: Select images that cover underrepresented regions of the feature space. Use embeddings from the model's penultimate layer and cluster them — sample from sparse clusters where the model has seen few examples.\n\n**3. Query-by-Committee**: Train multiple models (or use dropout as a committee) and select images where the committee members disagree most. High disagreement = high information gain.\n\nFor drone data specifically, active learning is even more impactful because of the long-tail distribution: 90% of images show 'normal' scenes (healthy forest, intact power lines), while the 10% showing anomalies (smoke, damage, intruders) are the ones the model needs to learn most. Active learning naturally focuses labeling effort on this critical tail.",
      },
      {
        id: "al-pipeline",
        title: "Building an Active Learning Pipeline",
        type: "code",
        content:
          "This pipeline implements a complete active learning loop. It takes a trained model, runs inference on unlabeled data, selects the most informative samples, creates labeling tasks via CVAT API, and retrains after labels are received.",
        language: "python",
        code: `import numpy as np
import torch
from torch.utils.data import DataLoader, Subset
from pathlib import Path
from dataclasses import dataclass
import httpx
import json

@dataclass
class SampleScore:
    """Score for an unlabeled sample's informativeness."""
    index: int
    image_path: str
    uncertainty: float
    diversity: float
    combined_score: float

class ActiveLearningPipeline:
    """Automated active learning pipeline for drone image labeling."""

    def __init__(self, model, feature_extractor, unlabeled_dataset,
                 labeled_indices: list[int] = None):
        self.model = model
        self.feature_extractor = feature_extractor
        self.dataset = unlabeled_dataset
        self.labeled = set(labeled_indices or [])
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def compute_uncertainty(self, batch_size: int = 64,
                            mc_dropout_passes: int = 10) -> dict[int, float]:
        """Compute prediction uncertainty using MC Dropout."""
        self.model.train()  # enable dropout for MC sampling
        unlabeled_indices = [i for i in range(len(self.dataset))
                            if i not in self.labeled]
        subset = Subset(self.dataset, unlabeled_indices)
        loader = DataLoader(subset, batch_size=batch_size, shuffle=False)

        all_uncertainties = {}
        idx_offset = 0

        for images, _ in loader:
            images = images.to(self.device)

            # MC Dropout: run multiple forward passes
            predictions = []
            with torch.no_grad():
                for _ in range(mc_dropout_passes):
                    logits = self.model(images)
                    probs = torch.softmax(logits, dim=1)
                    predictions.append(probs.cpu().numpy())

            # Stack predictions: (mc_passes, batch, classes)
            preds = np.stack(predictions)

            # Uncertainty metrics
            mean_preds = preds.mean(axis=0)  # (batch, classes)
            # Predictive entropy
            entropy = -np.sum(mean_preds * np.log(mean_preds + 1e-10), axis=1)
            # BALD (Bayesian Active Learning by Disagreement)
            individual_entropy = -np.sum(preds * np.log(preds + 1e-10), axis=2)
            bald = entropy - individual_entropy.mean(axis=0)

            for j in range(len(images)):
                orig_idx = unlabeled_indices[idx_offset + j]
                all_uncertainties[orig_idx] = float(bald[j])

            idx_offset += len(images)

        self.model.eval()
        return all_uncertainties

    def compute_diversity(self, batch_size: int = 64) -> dict[int, np.ndarray]:
        """Extract feature embeddings for diversity sampling."""
        self.model.eval()
        unlabeled_indices = [i for i in range(len(self.dataset))
                            if i not in self.labeled]
        subset = Subset(self.dataset, unlabeled_indices)
        loader = DataLoader(subset, batch_size=batch_size, shuffle=False)

        embeddings = {}
        idx_offset = 0

        with torch.no_grad():
            for images, _ in loader:
                images = images.to(self.device)
                features = self.feature_extractor(images).cpu().numpy()
                for j in range(len(images)):
                    orig_idx = unlabeled_indices[idx_offset + j]
                    embeddings[orig_idx] = features[j]
                idx_offset += len(images)

        return embeddings

    def select_samples(self, budget: int = 100,
                       uncertainty_weight: float = 0.7,
                       diversity_weight: float = 0.3) -> list[SampleScore]:
        """Select most informative samples using combined scoring."""
        # Compute uncertainty scores
        uncertainties = self.compute_uncertainty()

        # Compute diversity via embedding clustering
        embeddings = self.compute_diversity()
        from sklearn.cluster import KMeans

        indices = list(embeddings.keys())
        embed_matrix = np.array([embeddings[i] for i in indices])

        # K-means clustering — prefer samples from sparse clusters
        n_clusters = min(budget * 2, len(indices))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=3)
        cluster_labels = kmeans.fit_predict(embed_matrix)
        cluster_sizes = np.bincount(cluster_labels)

        # Diversity = inverse of cluster density
        diversity_scores = {}
        for i, idx in enumerate(indices):
            diversity_scores[idx] = 1.0 / (cluster_sizes[cluster_labels[i]] + 1)

        # Normalize scores
        unc_vals = np.array([uncertainties[i] for i in indices])
        div_vals = np.array([diversity_scores[i] for i in indices])
        unc_norm = (unc_vals - unc_vals.min()) / (unc_vals.max() - unc_vals.min() + 1e-10)
        div_norm = (div_vals - div_vals.min()) / (div_vals.max() - div_vals.min() + 1e-10)

        # Combined scoring
        scores = []
        for i, idx in enumerate(indices):
            combined = uncertainty_weight * unc_norm[i] + diversity_weight * div_norm[i]
            scores.append(SampleScore(
                index=idx,
                image_path=str(self.dataset.images[idx]),
                uncertainty=float(unc_norm[i]),
                diversity=float(div_norm[i]),
                combined_score=float(combined),
            ))

        # Select top-k
        scores.sort(key=lambda s: s.combined_score, reverse=True)
        selected = scores[:budget]

        print(f"Selected {len(selected)} samples for labeling")
        print(f"  Avg uncertainty: {np.mean([s.uncertainty for s in selected]):.3f}")
        print(f"  Avg diversity: {np.mean([s.diversity for s in selected]):.3f}")

        return selected

    def create_cvat_tasks(self, samples: list[SampleScore],
                          project_id: int,
                          cvat_url: str = "http://localhost:8080",
                          api_key: str = "") -> list[int]:
        """Create labeling tasks in CVAT for selected samples."""
        headers = {"Authorization": f"Token {api_key}"}
        task_ids = []

        # Batch images into tasks of 50
        for i in range(0, len(samples), 50):
            batch = samples[i:i+50]
            task_data = {
                "name": f"Active Learning Batch - Round {len(self.labeled)//100 + 1}",
                "project_id": project_id,
                "labels": [],  # inherit from project
            }

            with httpx.Client(base_url=cvat_url, headers=headers) as client:
                # Create task
                resp = client.post("/api/tasks", json=task_data)
                resp.raise_for_status()
                task_id = resp.json()["id"]
                task_ids.append(task_id)

                # Upload images
                files = [("client_files[]", open(s.image_path, "rb"))
                         for s in batch]
                client.post(
                    f"/api/tasks/{task_id}/data",
                    files=files,
                    data={"image_quality": 95},
                )
                for _, f in files:
                    f.close()

            print(f"Created CVAT task {task_id} with {len(batch)} images")

        return task_ids

# ─── Active Learning Loop ───
def active_learning_loop(model, dataset, rounds: int = 5,
                         budget_per_round: int = 100):
    """Run the complete active learning loop."""
    labeled_indices = []

    for round_num in range(1, rounds + 1):
        print(f"\\n{'='*50}")
        print(f"Active Learning Round {round_num}/{rounds}")
        print(f"Currently labeled: {len(labeled_indices)} samples")

        # 1. Select informative samples
        pipeline = ActiveLearningPipeline(model, model.backbone, dataset,
                                           labeled_indices)
        selected = pipeline.select_samples(budget=budget_per_round)

        # 2. Send to labeling (or simulate with ground truth)
        new_indices = [s.index for s in selected]
        labeled_indices.extend(new_indices)

        # 3. Retrain on expanded labeled set
        labeled_subset = Subset(dataset, labeled_indices)
        train_loader = DataLoader(labeled_subset, batch_size=32, shuffle=True)

        # Training loop here...
        print(f"Retraining on {len(labeled_indices)} labeled samples")

        # 4. Evaluate
        # val_accuracy = evaluate(model, val_loader)
        # print(f"Validation accuracy: {val_accuracy:.3f}")`,
      },
      {
        id: "al-exercise",
        title: "Lab: Active Learning for Fire Detection",
        type: "exercise",
        content:
          "**Objective:** Implement and evaluate an active learning pipeline for drone-based fire/smoke detection.\n\n1. **Prepare dataset** — Use a fire detection dataset (e.g., D-Fire or FLAME dataset). Split into: 100 initially labeled, 5,000 unlabeled, 1,000 validation.\n\n2. **Baseline model** — Train a MobileNetV4 classifier on the initial 100 labeled samples. Record validation accuracy.\n\n3. **Implement active learning** — Run 5 rounds, selecting 100 samples per round. Compare three strategies:\n   - Random sampling (baseline)\n   - Uncertainty sampling (MC Dropout entropy)\n   - Combined uncertainty + diversity\n\n4. **Plot learning curves** — Show validation accuracy vs. number of labeled samples for all three strategies. Active learning should reach the same accuracy with 40-60% fewer labels.\n\n5. **CVAT integration** — Set up CVAT locally via Docker. Implement the pipeline that creates tasks for human review. Add a callback that retrieves completed annotations and triggers retraining.\n\n**Deliverables:** Active learning pipeline code, learning curve plot, comparison table, CVAT integration demo.",
      },
    ],
    keyTakeaways: [
      "Active learning can reduce labeling costs by 60-80% by selecting the most informative samples",
      "MC Dropout provides uncertainty estimates without architectural changes — just enable dropout at inference time",
      "Combining uncertainty with diversity sampling avoids redundant selection from the same region of feature space",
      "CVAT and Labelbox APIs enable programmatic labeling task creation integrated into ML pipelines",
      "The active learning loop (train → predict → select → label → retrain) creates a continuous improvement cycle",
    ],
    resources: [
      { title: "CVAT (Computer Vision Annotation Tool)", url: "https://www.cvat.ai/" },
      { title: "Labelbox API Documentation", url: "https://docs.labelbox.com/" },
      { title: "modAL (Active Learning Framework)", url: "https://modal-python.readthedocs.io/" },
      { title: "BatchBALD (Bayesian Active Learning)", url: "https://arxiv.org/abs/1906.08158" },
    ],
  },
];
