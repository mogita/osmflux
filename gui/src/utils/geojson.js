import GeoJsonGeometries from 'geojson-geometries'

export function geojsonToPoly(input) {
  const extracted = new GeoJsonGeometries(input)
  if (extracted.polygons.features.length === 0) {
    throw new Error('No polygon found in the shape file.')
  }

  let result = 'unnamed_polygon\n'
  let idx = 1
  for (const polygon of extracted.polygons.features) {
    result += fromFeature(polygon, idx)
    idx++
  }
  result += `END\n`
  return result
}

function fromFeature(feat, idx) {
  let result = ''
  switch ((feat?.geometry?.type || '').toLowerCase()) {
    case 'polygon':
      result += `${idx}\n`
      result += toPoly(feat.geometry.coordinates)
      result += 'END\n'
      break
    case 'multipolygon':
      for (let i = 0; i < feat.geometry.coordinates; i++) {
        result += `${i + 1}\n`
        result += toPoly(feat.geometry.coordinates[i])
        result += 'END\n'
      }
      break
  }

  return result
}

function toPoly(coords) {
  let result = ''
  if (!Array.isArray(coords) || coords.length === 0) {
    return result
  }
  for (const line of coords) {
    for (const point of line) {
      result += `\t${point[0]} ${point[1]}\n`
    }
  }
  return result
}
