import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'

var conditionalLineVertShader = /* glsl */`
attribute vec3 control0;
attribute vec3 control1;
attribute vec3 direction;
attribute float collapse;
attribute vec3 instPos;

#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
      #include <color_vertex>

      // Transform the line segment ends and control points into camera clip space
      vec4 c0 = projectionMatrix * modelViewMatrix * vec4( control0 + instPos, 1.0 );
      vec4 c1 = projectionMatrix * modelViewMatrix * vec4( control1 + instPos, 1.0 );
      vec4 p0 = projectionMatrix * modelViewMatrix * vec4( position + instPos, 1.0 );
      vec4 p1 = projectionMatrix * modelViewMatrix * vec4( position + instPos + direction, 1.0 );

      c0.xy /= c0.w;
      c1.xy /= c1.w;
      p0.xy /= p0.w;
      p1.xy /= p1.w;

      // Get the direction of the segment and an orthogonal vector
      vec2 dir = p1.xy - p0.xy;
      vec2 norm = vec2( -dir.y, dir.x );

      // Get control point directions from the line
      vec2 c0dir = c0.xy - p1.xy;
      vec2 c1dir = c1.xy - p1.xy;

      // If the vectors to the controls points are pointed in different directions away
      // from the line segment then the line should not be drawn.
      float d0 = dot( normalize( norm ), normalize( c0dir ) );
      float d1 = dot( normalize( norm ), normalize( c1dir ) );
      float discardFlag = float( sign( d0 ) != sign( d1 ) );

vec3 p = position + instPos + ((discardFlag > 0.5) ? direction * collapse : vec3(0));    
vec4 mvPosition = modelViewMatrix * vec4( p, 1.0 );
      gl_Position = projectionMatrix * mvPosition;

      #include <logdepthbuf_vertex>
      #include <clipping_planes_vertex>
      #include <fog_vertex>
}
`;

var conditionalLineFragShader = /* glsl */`
uniform vec3 diffuse;
uniform float opacity;

#include <common>
#include <color_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
      #include <clipping_planes_fragment>
      vec3 outgoingLight = vec3( 0.0 );
      vec4 diffuseColor = vec4( diffuse, opacity );
      #include <logdepthbuf_fragment>
      #include <color_fragment>
      outgoingLight = diffuseColor.rgb; // simple shader
      gl_FragColor = vec4( outgoingLight, diffuseColor.a );
      #include <tonemapping_fragment>
      #include <encodings_fragment>
      #include <fog_fragment>
      #include <premultiplied_alpha_fragment>
}
`;

function EdgesGeometry(geometry, thresholdAngle, scene) {

    let g = new THREE.InstancedBufferGeometry();

    g.type = 'EdgesGeometry';

    g.parameters = {
        thresholdAngle: thresholdAngle
    };

    thresholdAngle = (thresholdAngle !== undefined) ? thresholdAngle : 1;

    // buffer

    const vertices = [];
    const control0 = [];
    const control1 = [];
    const direction = [];
    const collapse = [];

    // helper variables

    const thresholdDot = Math.cos(THREE.MathUtils.DEG2RAD * thresholdAngle);

    const edge = [0, 0], edges = {}, eArray = [];
    let edge1, edge2, key;
    const keys = ['a', 'b', 'c'];

    // prepare source geometry

    let geometry2, geometry2a;

    if (geometry.isBufferGeometry) {

        geometry2a = geometry.clone();
        //geometry2.fromBufferGeometry( geometry );

    } else {

        geometry2a = geometry.clone();

    }
    //console.log(geometry2a.index.count / geometry2a.attributes.position.array.length);
    var ratio = (geometry2a.attributes.position.array.length / geometry2a.index.count)
    geometry2 = BufferGeometryUtils.mergeVertices(geometry2a, ratio);
    console.log(geometry2a);
    //geometry2.mergeVertices();
    geometry2.computeVertexNormals();


    const sourceVertices = geometry2.attributes.position;

    var sv = [];
    var normalss = []
    const faces = [];
    const vs = [];
    var ori = new THREE.Vector3()

    var a = new THREE.Vector3();
    var b = new THREE.Vector3()
    var c = new THREE.Vector3();
    var tri = new THREE.Triangle()


    for (let s = 0; s < sourceVertices.array.length; s++) {
        sv.push(new THREE.Vector3(sourceVertices.array[s * 3 + 0], sourceVertices.array[s * 3 + 1], sourceVertices.array[s * 3 + 2]))
    }
    scene.updateMatrixWorld()

    var index = geometry2.index;
    var facess = index.count / 3;
    var normIdx = [];

    for (let i = 0; i < facess; i++) {
        var triy = {};
        triy.a = index.array[i * 3 + 0];
        triy.b = index.array[i * 3 + 1];
        triy.c = index.array[i * 3 + 2];

        var dir = new THREE.Vector3();
        a.fromBufferAttribute(sourceVertices, index.array[i * 3 + 0]);
        b.fromBufferAttribute(sourceVertices, index.array[i * 3 + 1]);
        c.fromBufferAttribute(sourceVertices, index.array[i * 3 + 2]);
        tri.set(a, b, c);
        tri.getMidpoint(ori);
        tri.getNormal(dir);

        //triArr.push(triy)


        triy.normal = dir
        faces.push(triy)


        //console.log(tri1);
        //console.log(tri1);
    }






    for (let i = 0; i < faces.length; i++) {
        var face = faces[i]




        for (let j = 0; j < 3; j++) {

            edge1 = face[keys[j]];


            edge2 = face[keys[(j + 1) % 3]];
            edge[0] = Math.min(edge1, edge2);
            edge[1] = Math.max(edge1, edge2);

            key = edge[0] + ',' + edge[1];

            if (edges[key] === undefined) {

                edges[key] = { index1: edge[0], index2: edge[1], face1: i, face2: undefined };

            } else {

                edges[key].face2 = i;

            }



        }

    }


    // generate vertices
    const v3 = new THREE.Vector3();
    const n = new THREE.Vector3();
    const n1 = new THREE.Vector3();
    const n2 = new THREE.Vector3();
    const d = new THREE.Vector3();



    for (key in edges) {

        //console.log( key);
        const e = edges[key];




        // an edge is only rendered if the angle (in degrees) between the face normals of the adjoining faces exceeds this value. default = 1 degree.
        //console.log(faces);
        if (e.face2 === undefined || faces[e.face1].normal.dot(faces[e.face2].normal) <= thresholdDot) {
            //console.log('fshg');
            let vertex1 = sv[e.index1];
            let vertex2 = sv[e.index2];
            //console.log(vertex1);

            vertices.push(vertex1.x, vertex1.y, vertex1.z);
            vertices.push(vertex2.x, vertex2.y, vertex2.z);


            //console.log(vertices);

            d.subVectors(vertex2, vertex1);
            collapse.push(0, 1);
            n.copy(d).normalize();
            direction.push(d.x, d.y, d.z);
            n1.copy(faces[e.face1].normal);
            n1.crossVectors(n, n1);
            d.subVectors(vertex1, vertex2);
            // n.copy(d).normalize();
            // n2.copy(faces[e.face2].normal);
            n2.crossVectors(n, n2);
            direction.push(d.x, d.y, d.z);

            v3.copy(vertex1).add(n1); // control0
            control0.push(v3.x, v3.y, v3.z);
            v3.copy(vertex1).add(n2); // control1
            control1.push(v3.x, v3.y, v3.z);

            v3.copy(vertex2).add(n1); // control0
            control0.push(v3.x, v3.y, v3.z);
            v3.copy(vertex2).add(n2); // control1
            control1.push(v3.x, v3.y, v3.z);
        }

    }

    // build geometry
    //g.setAttribute( 'position', new THREE.BufferAttribute (new Float32Array( vertices), 3)  );
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    g.setAttribute('control0', new THREE.Float32BufferAttribute(control0, 3));
    g.setAttribute('control1', new THREE.Float32BufferAttribute(control1, 3));
    g.setAttribute('direction', new THREE.Float32BufferAttribute(direction, 3));
    g.setAttribute('collapse', new THREE.Float32BufferAttribute(collapse, 1));
    console.log(g);
    return g;

}

export function createOutlineSegments(geometry, color, scene) {
    let eg = EdgesGeometry(geometry, 1, scene);
    let m = new THREE.ShaderMaterial({
        vertexShader: conditionalLineVertShader,
        fragmentShader: conditionalLineFragShader,
        uniforms: {
            diffuse: {
                value: new THREE.Color(color)
            },
            opacity: {
                value: 0
            }
        },
        transparent: false
    });
    let o = new THREE.LineSegments(eg, m);
    o.frustumCulled = false
    console.log(o);
    return o;
}