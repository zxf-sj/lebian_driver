// utils/coordinateTransform.js

const PI = 3.1415926535897932384626;
const X_PI = Math.PI * 3000.0 / 180.0;

/**
 * GCJ02 转 BD09
 */
function gcj02ToBd09(lng, lat) {
    const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI);
    const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI);
    const bd_lng = z * Math.cos(theta) + 0.0065;
    const bd_lat = z * Math.sin(theta) + 0.006;
    return [bd_lng, bd_lat];
}

/**
 * BD09 转 GCJ02 (反向转换备用)
 */
function bd09ToGcj02(bd_lng, bd_lat) {
    const x = bd_lng - 0.0065;
    const y = bd_lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
    const gg_lng = z * Math.cos(theta);
    const gg_lat = z * Math.sin(theta);
    return [gg_lng, gg_lat];
}

module.exports = {
    gcj02ToBd09,
    bd09ToGcj02
};