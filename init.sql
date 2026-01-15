CREATE TABLE sensor_readings (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  temperature DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  light DOUBLE PRECISION
);

CREATE INDEX index_timestamps ON sensor_readings(timestamp DESC);
