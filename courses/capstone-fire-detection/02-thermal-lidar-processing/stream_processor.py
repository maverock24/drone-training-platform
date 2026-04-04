import faust

app = faust.App('drone-streams', broker='kafka://localhost:9092')

class DroneTelemetry(faust.Record, serializer='json'):
    timestamp: float
    lat: float
    lon: float
    alt: float
    thermal_max: float

telemetry_topic = app.topic('drone-telemetry', value_type=DroneTelemetry)

@app.agent(telemetry_topic)
async def process_telemetry(streams):
    async for event in streams:
        if event.thermal_max > 85.0:
            print(f"🔥 Potential fire detected at {event.lat}, {event.lon}")

if __name__ == '__main__':
    app.main()
