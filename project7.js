// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var mv = trans;
	return mv;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		this.prog = InitShaderProgram(VS, FS);

		this.mvp = gl.getUniformLocation(this.prog, 'mvp');
		this.mv = gl.getUniformLocation(this.prog, 'mv');
		this.normMAT = gl.getUniformLocation(this.prog, 'normMAT');
		this.shiny = gl.getUniformLocation(this.prog, 'shiny');

		this.pos = gl.getAttribLocation(this.prog, 'pos');
		this.flip = gl.getUniformLocation(this.prog, 'flip');
		this.showTex = gl.getUniformLocation(this.prog, 'showTex');

		this.txc = gl.getAttribLocation(this.prog, 'txc');
		this.sampler = gl.getUniformLocation(this.prog, 'tex');

		this.normal = gl.getAttribLocation(this.prog, 'normal');
		this.lightPass = gl.getUniformLocation(this.prog, 'lightPass');


		this.tex_buffer = gl.createBuffer();
		this.vert_buffer = gl.createBuffer();
		this.norm_buffer = gl.createBuffer();

		this.light = [0.0, 0.0, 0.0];
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		this.numTriangles = vertPos.length / 3;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vert_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW)

		gl.bindBuffer(gl.ARRAY_BUFFER, this.norm_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW)
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		gl.useProgram( this.prog );

		if(swap) 
		{
			gl.uniform1f(this.flip, 1);
		}
		else
		{
			gl.uniform1f(this.flip, 0);
		}
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		gl.useProgram( this.prog );
		gl.uniformMatrix4fv( this.mvp, false, matrixMVP);
		gl.uniformMatrix4fv( this.mv, false, matrixMV);
		gl.uniformMatrix3fv( this.normMAT, false, matrixNormal);

		gl.uniform3f(this.lightPass, this.light[0], this.light[1], this.light[2]);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vert_buffer);
		gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.pos);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.norm_buffer);
		gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.normal);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.tex_buffer);
		gl.vertexAttribPointer(this.txc, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.txc);
		gl.uniform1f(this.sampler, 0)

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		const texture = gl.createTexture();
		//gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		gl.generateMipmap(gl.TEXTURE_2D);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.useProgram( this.prog );
		gl.uniform1f(this.showTex, 1);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		gl.useProgram( this.prog );

		if(show) 
		{
			gl.uniform1f(this.showTex, 1);
		}
		else
		{
			gl.uniform1f(this.showTex, 0);
		}
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		gl.useProgram( this.prog );
		this.light[0] = x;
		this.light[1] = y;
		this.light[2] = z;
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		gl.useProgram( this.prog );
		gl.uniform1f(this.shiny, shininess);
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
	}
}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ); // The total for per particle

	// [TO-DO] Compute the total force of each particle
	//gravity mull particleMass
	for(let i = 0; i < forces.length; i++)
	{
		forces[i] = gravity.mul(particleMass);
	}

	for(let i = 0; i < springs.length; i++)
	{
		//forces[i] = gravity.mul(particleMass);
		var p1 = springs[i].p1;
		var p0 = springs[i].p0;

		//SFORCE
		var distance = Math.pow(positions[p1].x - positions[p0].x, 2) 
		+ Math.pow(positions[p1].y - positions[p0].y, 2) 
		+ Math.pow(positions[p1].z - positions[p0].z, 2);
		distance = Math.sqrt(distance);

		var rest = springs[i].rest;
		var dir = (positions[p1].sub(positions[p0])).div(distance);
		//dir.normalize();
		var sForce = dir.mul(stiffness * (distance - rest));

		//DAMP
		var df = (velocities[p1].sub(velocities[p0])).dot(dir);
		var dampingForce = dir.mul(damping * df);

		//apply both
		forces[p0].inc(sForce.add(dampingForce));
		forces[p1].dec(sForce.add(dampingForce));
	}

	// [TO-DO] Update positions and velocities
	for(var i = 0; i < positions.length; i++)
	{
		var accel = forces[i].div(particleMass);

		velocities[i].inc(accel.mul(dt));
		positions[i].inc(velocities[i].mul(dt));

		if(positions[i].y < -1)
		{
			positions[i].y = -1;
			velocities[i] = velocities[i].mul(-restitution);
		}
		if(positions[i].y > 1)
		{
			positions[i].y = 1;
			velocities[i] = velocities[i].mul(-restitution);
		}
		if(positions[i].x < -1)
		{
			positions[i].x = -1;
			velocities[i] = velocities[i].mul(-restitution);
		}
		if(positions[i].x > 1)
		{
			positions[i].x = 1;
			velocities[i] = velocities[i].mul(-restitution);
		}
		if(positions[i].z < -1)
		{
			positions[i].z = -1;
			velocities[i] = velocities[i].mul(-restitution);
		}
		if(positions[i].z > 1)
		{
			positions[i].z = 1;
			velocities[i] = velocities[i].mul(-restitution);
		}
	}

	// [TO-DO] Handle collisions
	//dec pos by h
	
}

// Vertex Shader
var VS = `
	precision mediump float;
	attribute vec3 pos;
	attribute vec2 txc;
	uniform float flip;

	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 normMAT;
	varying mat4 mvF;
	varying mat3 normMATF;

	varying vec2 tCord;

	attribute vec3 normal;
	varying vec3 norm;
	uniform vec3 lightPass;
	varying vec3 light;
	varying vec3 posFS;
	
	uniform float shiny;

	void main()
	{
		gl_Position = mvp * ((vec4(pos, 1) * (1.0 - flip)) + (vec4(pos.x, pos.z, pos.y, 1) * flip));
		posFS = pos;
		tCord = txc;
		norm = normal;
		light = lightPass;

		mvF = mv;
		normMATF = normMAT;
	}
`;

// Fragment Shader
var FS = `
	//uniform float theta;

	precision mediump float;
	uniform sampler2D tex;
	uniform float showTex;
	uniform float shiny;
	varying vec2 tCord;

	varying vec3 norm;
	varying vec3 light;
	varying mat4 mvF;
	varying mat3 normMATF;
	varying vec3 posFS;

	void main()
	{
		//gl_FragColor = vec4(1, 1, 1, 1);
		//gl_FragColor = vec4(1, 1, 1, 1) * dot(normalize(norm),  light) ;
		vec4 vr = -(mvF * vec4(posFS, 1));
		vec3 halff = normalize(vec3(vr.x, vr.y, vr.z) + light);
		float normed = dot(normalize(norm * normMATF), halff);
		//vec4 bc = (texture2D(tex, tCord) * showTex) + (vec4(1, 1, 1, 1) * (1.0 - showTex));
		vec4 bc = vec4(1, 1, 1, 1);
		vec3 temp = vec3(bc.x, bc.y, bc.z) * dot(normalize(norm * normMATF),  light) + (vec3(1, 1, 1) * pow(normed, shiny));
		gl_FragColor = vec4(temp, 1);
		//gl_FragColor = (texture2D(tex, tCord) * showTex) + (vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1) * (1.0 - showTex));
	}
`;