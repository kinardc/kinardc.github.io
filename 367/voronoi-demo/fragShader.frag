    #include <common>

    uniform vec3 u_resolution;
    uniform float u_time;

    void mainImage( in vec4 fragCoord, out vec4 fragColor )
    {
        // Define centroids of voronoi areas.
        vec2 point[5];
        point[0] = vec2(0.83,0.75);
        point[1] = vec2(0.60,0.07);
        point[2] = vec2(0.28,0.64);
        point[3] =  vec2(0.31,0.26);

        // Get current pixel position.
        vec2 currentPixel = fragCoord.xy / u_resolution.xy;
        currentPixel = currentPixel * (u_resolution.x / u_resolution.y);

        vec3 pixelColor = vec3(0.0);
        vec2 closestCentroid;
        float minimumDistance = 1.0;

        for (int i = 0; i < 5; ++i) {
            float currentDistance = distance(currentPixel, point[i]);
            if (currentDistance < minimumDistance) {
                minimumDistance = currentDistance;
                closestCentroid = point[i];
            }
        }

        // Add distance field to closest point center
        pixelColor += minimumDistance*2.0;

        // tint acording the closest point position
        pixelColor.rg = closestCentroid;

        // Show isolines
        pixelColor = pixelColor - abs(sin(80.0*minimumDistance))*0.07;

        // Draw point center
        pixelColor = pixelColor + 1.0 - step(0.02, minimumDistance);

        fragColor = vec4(pixelColor, 1.0);
    }

    void main() {
        mainImage( gl_FragCoord, gl_FragColor );
    }