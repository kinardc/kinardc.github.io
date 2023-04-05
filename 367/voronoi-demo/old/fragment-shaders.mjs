export const testFragShader = `
    #include <common>

    uniform vec3 iResolution;
    uniform float iTime;

    // By iq: https://www.shadertoy.com/user/iq  
    // license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        // Normalized pixel coordinates (from 0 to 1)
        vec2 uv = fragCoord/iResolution.xy;

        // Time varying pixel color
        vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));

        // Output to screen
        fragColor = vec4(col,1.0);
    }

    void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
    }
`;

export const voronoiShader = `
    #include <common>

    uniform vec3 u_resolution;
    uniform float u_time;
    varying vec2 v_uv;

    // void mainImage( in vec4 fragCoord, out vec4 fragColor )
    void mainImage( in vec2 fragCoord, out vec4 fragColor )
    {
        float aspectRatio = u_resolution.x / u_resolution.y;

        // Define centroids of voronoi areas.
        vec2 center = vec2(u_resolution.x / 2.0, u_resolution.y / 2.0);
        vec2 point[5];
        point[0] = vec2(0.25 * aspectRatio, 0.25);
        point[1] = vec2(0.25 * aspectRatio, 0.75);
        point[2] = vec2(0.75 * aspectRatio, 0.25);
        point[3] = vec2(0.75 * aspectRatio, 0.75);
        point[4] = vec2(0.50 * aspectRatio, 0.50);

        // Normalized pixel coordinates (from 0 to 1)
        vec2 currentPixel = fragCoord.xy / u_resolution.xy;

        // Set xy aspect ratio to be 1:1
        currentPixel.x = currentPixel.x * aspectRatio;

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
        pixelColor = pixelColor + minimumDistance;

        // tint acording the closest point position
        // pixelColor.rb = closestCentroid;

        // Show isolines
        // pixelColor = pixelColor - abs(sin(80.0*minimumDistance))*0.07;

        // Draw point center
        pixelColor = pixelColor + 1.0 - step(0.02, minimumDistance);

        fragColor = vec4(pixelColor, 1.0);
    }

    void main() {
        // mainImage( gl_FragCoord, gl_FragColor );
        mainImage( v_uv * u_resolution.xy, gl_FragColor );
    }
`;

// export { testFragShader, voronoiShader };