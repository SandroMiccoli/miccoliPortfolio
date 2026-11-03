var InteractiveGlobe=(function(Ai){"use strict";var wn=typeof document<"u"?document.currentScript:null;/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const _r="170",Co=0,Po=1,Wa=2,on=100,Lo=101,Uo=102,Do=200,Io=201,No=202,Oo=203,vr=204,xr=205,Fo=206,Bo=207,zo=208,Ho=209,Go=210,Vo=211,ko=212,Wo=213,Xo=214,qo=0,jo=1,Yo=2,Ko=3,Zo=4,Jo=5,$o=6,Qo=7,Xa=300,An=301,Rn=302,Mr=303,Sr=304,Ri=306,Er=1e3,ln=1001,yr=1002,St=1003,el=1004,Ci=1005,Pt=1006,Tr=1007,cn=1008,qt=1009,qa=1010,ja=1011,ni=1012,br=1013,un=1014,Ot=1015,ii=1016,wr=1017,Ar=1018,Cn=1020,Ya=35902,Ka=1021,Za=1022,Lt=1023,Ja=1024,$a=1025,ri=1026,Pn=1027,Qa=1028,Rr=1029,es=1030,Cr=1031,Pr=1033,Pi=33776,Li=33777,Ui=33778,Di=33779,Lr=35840,Ur=35841,Dr=35842,Ir=35843,Nr=36196,Or=37492,Fr=37496,Br=37808,zr=37809,Hr=37810,Gr=37811,Vr=37812,kr=37813,Wr=37814,Xr=37815,qr=37816,jr=37817,Yr=37818,Kr=37819,Zr=37820,Jr=37821,Ii=36492,$r=36494,Qr=36495,ts=36283,ea=36284,ta=36285,na=36286,hn="",ut="srgb",Ln="srgb-linear",Ni="linear",Ge="srgb",Un=7680,tl=512,nl=513,il=514,rl=515,al=516,sl=517,ol=518,ll=519,ns=35044,is="300 es",Dn=2e3,Oi=2001;class In{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const n=this._listeners[e];if(n!==void 0){const r=n.indexOf(t);r!==-1&&n.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const t=this._listeners[e.type];if(t!==void 0){e.target=this;const n=t.slice(0);for(let r=0,a=n.length;r<a;r++)n[r].call(this,e);e.target=null}}}const nt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let rs=1234567;const ai=Math.PI/180,si=180/Math.PI;function Nn(){const i=4294967295*Math.random()|0,e=4294967295*Math.random()|0,t=4294967295*Math.random()|0,n=4294967295*Math.random()|0;return(nt[255&i]+nt[i>>8&255]+nt[i>>16&255]+nt[i>>24&255]+"-"+nt[255&e]+nt[e>>8&255]+"-"+nt[e>>16&15|64]+nt[e>>24&255]+"-"+nt[63&t|128]+nt[t>>8&255]+"-"+nt[t>>16&255]+nt[t>>24&255]+nt[255&n]+nt[n>>8&255]+nt[n>>16&255]+nt[n>>24&255]).toLowerCase()}function rt(i,e,t){return Math.max(e,Math.min(t,i))}function ia(i,e){return(i%e+e)%e}function oi(i,e,t){return(1-t)*i+t*e}function On(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function at(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(4294967295*i);case Uint16Array:return Math.round(65535*i);case Uint8Array:return Math.round(255*i);case Int32Array:return Math.round(2147483647*i);case Int16Array:return Math.round(32767*i);case Int8Array:return Math.round(127*i);default:throw new Error("Invalid component type.")}}const cl={DEG2RAD:ai,RAD2DEG:si,generateUUID:Nn,clamp:rt,euclideanModulo:ia,mapLinear:function(i,e,t,n,r){return n+(i-e)*(r-n)/(t-e)},inverseLerp:function(i,e,t){return i!==e?(t-i)/(e-i):0},lerp:oi,damp:function(i,e,t,n){return oi(i,e,1-Math.exp(-t*n))},pingpong:function(i,e=1){return e-Math.abs(ia(i,2*e)-e)},smoothstep:function(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e))*i*(3-2*i)},smootherstep:function(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e))*i*i*(i*(6*i-15)+10)},randInt:function(i,e){return i+Math.floor(Math.random()*(e-i+1))},randFloat:function(i,e){return i+Math.random()*(e-i)},randFloatSpread:function(i){return i*(.5-Math.random())},seededRandom:function(i){i!==void 0&&(rs=i);let e=rs+=1831565813;return e=Math.imul(e^e>>>15,1|e),e^=e+Math.imul(e^e>>>7,61|e),((e^e>>>14)>>>0)/4294967296},degToRad:function(i){return i*ai},radToDeg:function(i){return i*si},isPowerOfTwo:function(i){return!(i&i-1)&&i!==0},ceilPowerOfTwo:function(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))},floorPowerOfTwo:function(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))},setQuaternionFromProperEuler:function(i,e,t,n,r){const a=Math.cos,s=Math.sin,l=a(t/2),o=s(t/2),c=a((e+n)/2),u=s((e+n)/2),d=a((e-n)/2),h=s((e-n)/2),p=a((n-e)/2),_=s((n-e)/2);switch(r){case"XYX":i.set(l*u,o*d,o*h,l*c);break;case"YZY":i.set(o*h,l*u,o*d,l*c);break;case"ZXZ":i.set(o*d,o*h,l*u,l*c);break;case"XZX":i.set(l*u,o*_,o*p,l*c);break;case"YXY":i.set(o*p,l*u,o*_,l*c);break;case"ZYZ":i.set(o*_,o*p,l*u,l*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}},normalize:at,denormalize:On};class Oe{constructor(e=0,t=0){Oe.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(rt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),r=Math.sin(t),a=this.x-e.x,s=this.y-e.y;return this.x=a*n-s*r+e.x,this.y=a*r+s*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class ye{constructor(e,t,n,r,a,s,l,o,c){ye.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,a,s,l,o,c)}set(e,t,n,r,a,s,l,o,c){const u=this.elements;return u[0]=e,u[1]=r,u[2]=l,u[3]=t,u[4]=a,u[5]=o,u[6]=n,u[7]=s,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,a=this.elements,s=n[0],l=n[3],o=n[6],c=n[1],u=n[4],d=n[7],h=n[2],p=n[5],_=n[8],x=r[0],f=r[3],m=r[6],g=r[1],v=r[4],T=r[7],O=r[2],C=r[5],B=r[8];return a[0]=s*x+l*g+o*O,a[3]=s*f+l*v+o*C,a[6]=s*m+l*T+o*B,a[1]=c*x+u*g+d*O,a[4]=c*f+u*v+d*C,a[7]=c*m+u*T+d*B,a[2]=h*x+p*g+_*O,a[5]=h*f+p*v+_*C,a[8]=h*m+p*T+_*B,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],r=e[2],a=e[3],s=e[4],l=e[5],o=e[6],c=e[7],u=e[8];return t*s*u-t*l*c-n*a*u+n*l*o+r*a*c-r*s*o}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],a=e[3],s=e[4],l=e[5],o=e[6],c=e[7],u=e[8],d=u*s-l*c,h=l*o-u*a,p=c*a-s*o,_=t*d+n*h+r*p;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/_;return e[0]=d*x,e[1]=(r*c-u*n)*x,e[2]=(l*n-r*s)*x,e[3]=h*x,e[4]=(u*t-r*o)*x,e[5]=(r*a-l*t)*x,e[6]=p*x,e[7]=(n*o-c*t)*x,e[8]=(s*t-n*a)*x,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,a,s,l){const o=Math.cos(a),c=Math.sin(a);return this.set(n*o,n*c,-n*(o*s+c*l)+s+e,-r*c,r*o,-r*(-c*s+o*l)+l+t,0,0,1),this}scale(e,t){return this.premultiply(ra.makeScale(e,t)),this}rotate(e){return this.premultiply(ra.makeRotation(-e)),this}translate(e,t){return this.premultiply(ra.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const ra=new ye;function as(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Fi(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function ul(){const i=Fi("canvas");return i.style.display="block",i}const ss={};function li(i){i in ss||(ss[i]=!0,console.warn(i))}const Ne={enabled:!0,workingColorSpace:Ln,spaces:{},convert:function(i,e,t){return this.enabled!==!1&&e!==t&&e&&t&&(this.spaces[e].transfer===Ge&&(i.r=Ft(i.r),i.g=Ft(i.g),i.b=Ft(i.b)),this.spaces[e].primaries!==this.spaces[t].primaries&&(i.applyMatrix3(this.spaces[e].toXYZ),i.applyMatrix3(this.spaces[t].fromXYZ)),this.spaces[t].transfer===Ge&&(i.r=Fn(i.r),i.g=Fn(i.g),i.b=Fn(i.b))),i},fromWorkingColorSpace:function(i,e){return this.convert(i,this.workingColorSpace,e)},toWorkingColorSpace:function(i,e){return this.convert(i,e,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===hn?Ni:this.spaces[i].transfer},getLuminanceCoefficients:function(i,e=this.workingColorSpace){return i.fromArray(this.spaces[e].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,e,t){return i.copy(this.spaces[e].toXYZ).multiply(this.spaces[t].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function Ft(i){return i<.04045?.0773993808*i:Math.pow(.9478672986*i+.0521327014,2.4)}function Fn(i){return i<.0031308?12.92*i:1.055*Math.pow(i,.41666)-.055}const os=[.64,.33,.3,.6,.15,.06],ls=[.2126,.7152,.0722],cs=[.3127,.329],us=new ye().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),hs=new ye().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);let Bn;Ne.define({[Ln]:{primaries:os,whitePoint:cs,transfer:Ni,toXYZ:us,fromXYZ:hs,luminanceCoefficients:ls,workingColorSpaceConfig:{unpackColorSpace:ut},outputColorSpaceConfig:{drawingBufferColorSpace:ut}},[ut]:{primaries:os,whitePoint:cs,transfer:Ge,toXYZ:us,fromXYZ:hs,luminanceCoefficients:ls,outputColorSpaceConfig:{drawingBufferColorSpace:ut}}});class hl{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Bn===void 0&&(Bn=Fi("canvas")),Bn.width=e.width,Bn.height=e.height;const n=Bn.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=Bn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Fi("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const r=n.getImageData(0,0,e.width,e.height),a=r.data;for(let s=0;s<a.length;s++)a[s]=255*Ft(a[s]/255);return n.putImageData(r,0,0),t}if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(255*Ft(t[n]/255)):t[n]=Ft(t[n]);return{data:t,width:e.width,height:e.height}}return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let dl=0;class ds{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:dl++}),this.uuid=Nn(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let a;if(Array.isArray(r)){a=[];for(let s=0,l=r.length;s<l;s++)r[s].isDataTexture?a.push(aa(r[s].image)):a.push(aa(r[s]))}else a=aa(r);n.url=a}return t||(e.images[this.uuid]=n),n}}function aa(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?hl.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let fl=0;class st extends In{constructor(e=st.DEFAULT_IMAGE,t=st.DEFAULT_MAPPING,n=1001,r=1001,a=1006,s=1008,l=1023,o=1009,c=st.DEFAULT_ANISOTROPY,u=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:fl++}),this.uuid=Nn(),this.name="",this.source=new ds(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=a,this.minFilter=s,this.anisotropy=c,this.format=l,this.internalFormat=null,this.type=o,this.offset=new Oe(0,0),this.repeat=new Oe(1,1),this.center=new Oe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new ye,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Xa)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Er:e.x=e.x-Math.floor(e.x);break;case ln:e.x=e.x<0?0:1;break;case yr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case Er:e.y=e.y-Math.floor(e.y);break;case ln:e.y=e.y<0?0:1;break;case yr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}st.DEFAULT_IMAGE=null,st.DEFAULT_MAPPING=Xa,st.DEFAULT_ANISOTROPY=1;class qe{constructor(e=0,t=0,n=0,r=1){qe.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,a=this.w,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r+s[12]*a,this.y=s[1]*t+s[5]*n+s[9]*r+s[13]*a,this.z=s[2]*t+s[6]*n+s[10]*r+s[14]*a,this.w=s[3]*t+s[7]*n+s[11]*r+s[15]*a,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,a;const o=e.elements,c=o[0],u=o[4],d=o[8],h=o[1],p=o[5],_=o[9],x=o[2],f=o[6],m=o[10];if(Math.abs(u-h)<.01&&Math.abs(d-x)<.01&&Math.abs(_-f)<.01){if(Math.abs(u+h)<.1&&Math.abs(d+x)<.1&&Math.abs(_+f)<.1&&Math.abs(c+p+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const v=(c+1)/2,T=(p+1)/2,O=(m+1)/2,C=(u+h)/4,B=(d+x)/4,F=(_+f)/4;return v>T&&v>O?v<.01?(n=0,r=.707106781,a=.707106781):(n=Math.sqrt(v),r=C/n,a=B/n):T>O?T<.01?(n=.707106781,r=0,a=.707106781):(r=Math.sqrt(T),n=C/r,a=F/r):O<.01?(n=.707106781,r=.707106781,a=0):(a=Math.sqrt(O),n=B/a,r=F/a),this.set(n,r,a,t),this}let g=Math.sqrt((f-_)*(f-_)+(d-x)*(d-x)+(h-u)*(h-u));return Math.abs(g)<.001&&(g=1),this.x=(f-_)/g,this.y=(d-x)/g,this.z=(h-u)/g,this.w=Math.acos((c+p+m-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class pl extends In{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new qe(0,0,e,t),this.scissorTest=!1,this.viewport=new qe(0,0,e,t);const r={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Pt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const a=new st(r,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);a.flipY=!1,a.generateMipmaps=n.generateMipmaps,a.internalFormat=n.internalFormat,this.textures=[];const s=n.count;for(let l=0;l<s;l++)this.textures[l]=a.clone(),this.textures[l].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,a=this.textures.length;r<a;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,r=e.textures.length;n<r;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new ds(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class dn extends pl{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class fs extends st{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=St,this.minFilter=St,this.wrapR=ln,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class ml extends st{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=St,this.minFilter=St,this.wrapR=ln,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class jt{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,a,s,l){let o=n[r+0],c=n[r+1],u=n[r+2],d=n[r+3];const h=a[s+0],p=a[s+1],_=a[s+2],x=a[s+3];if(l===0)return e[t+0]=o,e[t+1]=c,e[t+2]=u,void(e[t+3]=d);if(l===1)return e[t+0]=h,e[t+1]=p,e[t+2]=_,void(e[t+3]=x);if(d!==x||o!==h||c!==p||u!==_){let f=1-l;const m=o*h+c*p+u*_+d*x,g=m>=0?1:-1,v=1-m*m;if(v>Number.EPSILON){const O=Math.sqrt(v),C=Math.atan2(O,m*g);f=Math.sin(f*C)/O,l=Math.sin(l*C)/O}const T=l*g;if(o=o*f+h*T,c=c*f+p*T,u=u*f+_*T,d=d*f+x*T,f===1-l){const O=1/Math.sqrt(o*o+c*c+u*u+d*d);o*=O,c*=O,u*=O,d*=O}}e[t]=o,e[t+1]=c,e[t+2]=u,e[t+3]=d}static multiplyQuaternionsFlat(e,t,n,r,a,s){const l=n[r],o=n[r+1],c=n[r+2],u=n[r+3],d=a[s],h=a[s+1],p=a[s+2],_=a[s+3];return e[t]=l*_+u*d+o*p-c*h,e[t+1]=o*_+u*h+c*d-l*p,e[t+2]=c*_+u*p+l*h-o*d,e[t+3]=u*_-l*d-o*h-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,r=e._y,a=e._z,s=e._order,l=Math.cos,o=Math.sin,c=l(n/2),u=l(r/2),d=l(a/2),h=o(n/2),p=o(r/2),_=o(a/2);switch(s){case"XYZ":this._x=h*u*d+c*p*_,this._y=c*p*d-h*u*_,this._z=c*u*_+h*p*d,this._w=c*u*d-h*p*_;break;case"YXZ":this._x=h*u*d+c*p*_,this._y=c*p*d-h*u*_,this._z=c*u*_-h*p*d,this._w=c*u*d+h*p*_;break;case"ZXY":this._x=h*u*d-c*p*_,this._y=c*p*d+h*u*_,this._z=c*u*_+h*p*d,this._w=c*u*d-h*p*_;break;case"ZYX":this._x=h*u*d-c*p*_,this._y=c*p*d+h*u*_,this._z=c*u*_-h*p*d,this._w=c*u*d+h*p*_;break;case"YZX":this._x=h*u*d+c*p*_,this._y=c*p*d+h*u*_,this._z=c*u*_-h*p*d,this._w=c*u*d-h*p*_;break;case"XZY":this._x=h*u*d-c*p*_,this._y=c*p*d-h*u*_,this._z=c*u*_+h*p*d,this._w=c*u*d+h*p*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],r=t[4],a=t[8],s=t[1],l=t[5],o=t[9],c=t[2],u=t[6],d=t[10],h=n+l+d;if(h>0){const p=.5/Math.sqrt(h+1);this._w=.25/p,this._x=(u-o)*p,this._y=(a-c)*p,this._z=(s-r)*p}else if(n>l&&n>d){const p=2*Math.sqrt(1+n-l-d);this._w=(u-o)/p,this._x=.25*p,this._y=(r+s)/p,this._z=(a+c)/p}else if(l>d){const p=2*Math.sqrt(1+l-n-d);this._w=(a-c)/p,this._x=(r+s)/p,this._y=.25*p,this._z=(o+u)/p}else{const p=2*Math.sqrt(1+d-n-l);this._w=(s-r)/p,this._x=(a+c)/p,this._y=(o+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(rt(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,r=e._y,a=e._z,s=e._w,l=t._x,o=t._y,c=t._z,u=t._w;return this._x=n*u+s*l+r*c-a*o,this._y=r*u+s*o+a*l-n*c,this._z=a*u+s*c+n*o-r*l,this._w=s*u-n*l-r*o-a*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,r=this._y,a=this._z,s=this._w;let l=s*e._w+n*e._x+r*e._y+a*e._z;if(l<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,l=-l):this.copy(e),l>=1)return this._w=s,this._x=n,this._y=r,this._z=a,this;const o=1-l*l;if(o<=Number.EPSILON){const p=1-t;return this._w=p*s+t*this._w,this._x=p*n+t*this._x,this._y=p*r+t*this._y,this._z=p*a+t*this._z,this.normalize(),this}const c=Math.sqrt(o),u=Math.atan2(c,l),d=Math.sin((1-t)*u)/c,h=Math.sin(t*u)/c;return this._w=s*d+this._w*h,this._x=n*d+this._x*h,this._y=r*d+this._y*h,this._z=a*d+this._z*h,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),a=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),a*Math.sin(t),a*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class b{constructor(e=0,t=0,n=0){b.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ps.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ps.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,r=this.z,a=e.elements;return this.x=a[0]*t+a[3]*n+a[6]*r,this.y=a[1]*t+a[4]*n+a[7]*r,this.z=a[2]*t+a[5]*n+a[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,a=e.elements,s=1/(a[3]*t+a[7]*n+a[11]*r+a[15]);return this.x=(a[0]*t+a[4]*n+a[8]*r+a[12])*s,this.y=(a[1]*t+a[5]*n+a[9]*r+a[13])*s,this.z=(a[2]*t+a[6]*n+a[10]*r+a[14])*s,this}applyQuaternion(e){const t=this.x,n=this.y,r=this.z,a=e.x,s=e.y,l=e.z,o=e.w,c=2*(s*r-l*n),u=2*(l*t-a*r),d=2*(a*n-s*t);return this.x=t+o*c+s*d-l*u,this.y=n+o*u+l*c-a*d,this.z=r+o*d+a*u-s*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,r=this.z,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r,this.y=a[1]*t+a[5]*n+a[9]*r,this.z=a[2]*t+a[6]*n+a[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,r=e.y,a=e.z,s=t.x,l=t.y,o=t.z;return this.x=r*o-a*l,this.y=a*s-n*o,this.z=n*l-r*s,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return sa.copy(this).projectOnVector(e),this.sub(sa)}reflect(e){return this.sub(sa.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(rt(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,4*t)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,3*t)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=2*Math.random()-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const sa=new b,ps=new jt;class Yt{constructor(e=new b(1/0,1/0,1/0),t=new b(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Et.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Et.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Et.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const a=n.getAttribute("position");if(t===!0&&a!==void 0&&e.isInstancedMesh!==!0)for(let s=0,l=a.count;s<l;s++)e.isMesh===!0?e.getVertexPosition(s,Et):Et.fromBufferAttribute(a,s),Et.applyMatrix4(e.matrixWorld),this.expandByPoint(Et);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Bi.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Bi.copy(n.boundingBox)),Bi.applyMatrix4(e.matrixWorld),this.union(Bi)}const r=e.children;for(let a=0,s=r.length;a<s;a++)this.expandByObject(r[a],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Et),Et.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ci),zi.subVectors(this.max,ci),zn.subVectors(e.a,ci),Hn.subVectors(e.b,ci),Gn.subVectors(e.c,ci),Kt.subVectors(Hn,zn),Zt.subVectors(Gn,Hn),fn.subVectors(zn,Gn);let t=[0,-Kt.z,Kt.y,0,-Zt.z,Zt.y,0,-fn.z,fn.y,Kt.z,0,-Kt.x,Zt.z,0,-Zt.x,fn.z,0,-fn.x,-Kt.y,Kt.x,0,-Zt.y,Zt.x,0,-fn.y,fn.x,0];return!!oa(t,zn,Hn,Gn,zi)&&(t=[1,0,0,0,1,0,0,0,1],!!oa(t,zn,Hn,Gn,zi)&&(Hi.crossVectors(Kt,Zt),t=[Hi.x,Hi.y,Hi.z],oa(t,zn,Hn,Gn,zi)))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Et).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=.5*this.getSize(Et).length()),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(Bt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Bt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Bt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Bt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Bt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Bt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Bt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Bt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Bt)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Bt=[new b,new b,new b,new b,new b,new b,new b,new b],Et=new b,Bi=new Yt,zn=new b,Hn=new b,Gn=new b,Kt=new b,Zt=new b,fn=new b,ci=new b,zi=new b,Hi=new b,pn=new b;function oa(i,e,t,n,r){for(let a=0,s=i.length-3;a<=s;a+=3){pn.fromArray(i,a);const l=r.x*Math.abs(pn.x)+r.y*Math.abs(pn.y)+r.z*Math.abs(pn.z),o=e.dot(pn),c=t.dot(pn),u=n.dot(pn);if(Math.max(-Math.max(o,c,u),Math.min(o,c,u))>l)return!1}return!0}const gl=new Yt,ui=new b,la=new b;class zt{constructor(e=new b,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):gl.setFromPoints(e).getCenter(n);let r=0;for(let a=0,s=e.length;a<s;a++)r=Math.max(r,n.distanceToSquared(e[a]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ui.subVectors(e,this.center);const t=ui.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),r=.5*(n-this.radius);this.center.addScaledVector(ui,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(la.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ui.copy(e.center).add(la)),this.expandByPoint(ui.copy(e.center).sub(la))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Ht=new b,ca=new b,Gi=new b,Jt=new b,ua=new b,Vi=new b,ha=new b;class ki{constructor(e=new b,t=new b(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ht)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Ht.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Ht.copy(this.origin).addScaledVector(this.direction,t),Ht.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){ca.copy(e).add(t).multiplyScalar(.5),Gi.copy(t).sub(e).normalize(),Jt.copy(this.origin).sub(ca);const a=.5*e.distanceTo(t),s=-this.direction.dot(Gi),l=Jt.dot(this.direction),o=-Jt.dot(Gi),c=Jt.lengthSq(),u=Math.abs(1-s*s);let d,h,p,_;if(u>0)if(d=s*o-l,h=s*l-o,_=a*u,d>=0)if(h>=-_)if(h<=_){const x=1/u;d*=x,h*=x,p=d*(d+s*h+2*l)+h*(s*d+h+2*o)+c}else h=a,d=Math.max(0,-(s*h+l)),p=-d*d+h*(h+2*o)+c;else h=-a,d=Math.max(0,-(s*h+l)),p=-d*d+h*(h+2*o)+c;else h<=-_?(d=Math.max(0,-(-s*a+l)),h=d>0?-a:Math.min(Math.max(-a,-o),a),p=-d*d+h*(h+2*o)+c):h<=_?(d=0,h=Math.min(Math.max(-a,-o),a),p=h*(h+2*o)+c):(d=Math.max(0,-(s*a+l)),h=d>0?a:Math.min(Math.max(-a,-o),a),p=-d*d+h*(h+2*o)+c);else h=s>0?-a:a,d=Math.max(0,-(s*h+l)),p=-d*d+h*(h+2*o)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),r&&r.copy(ca).addScaledVector(Gi,h),p}intersectSphere(e,t){Ht.subVectors(e.center,this.origin);const n=Ht.dot(this.direction),r=Ht.dot(Ht)-n*n,a=e.radius*e.radius;if(r>a)return null;const s=Math.sqrt(a-r),l=n-s,o=n+s;return o<0?null:l<0?this.at(o,t):this.at(l,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0?!0:e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,a,s,l,o;const c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,h=this.origin;return c>=0?(n=(e.min.x-h.x)*c,r=(e.max.x-h.x)*c):(n=(e.max.x-h.x)*c,r=(e.min.x-h.x)*c),u>=0?(a=(e.min.y-h.y)*u,s=(e.max.y-h.y)*u):(a=(e.max.y-h.y)*u,s=(e.min.y-h.y)*u),n>s||a>r?null:((a>n||isNaN(n))&&(n=a),(s<r||isNaN(r))&&(r=s),d>=0?(l=(e.min.z-h.z)*d,o=(e.max.z-h.z)*d):(l=(e.max.z-h.z)*d,o=(e.min.z-h.z)*d),n>o||l>r?null:((l>n||n!=n)&&(n=l),(o<r||r!=r)&&(r=o),r<0?null:this.at(n>=0?n:r,t)))}intersectsBox(e){return this.intersectBox(e,Ht)!==null}intersectTriangle(e,t,n,r,a){ua.subVectors(t,e),Vi.subVectors(n,e),ha.crossVectors(ua,Vi);let s,l=this.direction.dot(ha);if(l>0){if(r)return null;s=1}else{if(!(l<0))return null;s=-1,l=-l}Jt.subVectors(this.origin,e);const o=s*this.direction.dot(Vi.crossVectors(Jt,Vi));if(o<0)return null;const c=s*this.direction.dot(ua.cross(Jt));if(c<0||o+c>l)return null;const u=-s*Jt.dot(ha);return u<0?null:this.at(u/l,a)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Ae{constructor(e,t,n,r,a,s,l,o,c,u,d,h,p,_,x,f){Ae.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,a,s,l,o,c,u,d,h,p,_,x,f)}set(e,t,n,r,a,s,l,o,c,u,d,h,p,_,x,f){const m=this.elements;return m[0]=e,m[4]=t,m[8]=n,m[12]=r,m[1]=a,m[5]=s,m[9]=l,m[13]=o,m[2]=c,m[6]=u,m[10]=d,m[14]=h,m[3]=p,m[7]=_,m[11]=x,m[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ae().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,r=1/Vn.setFromMatrixColumn(e,0).length(),a=1/Vn.setFromMatrixColumn(e,1).length(),s=1/Vn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*a,t[5]=n[5]*a,t[6]=n[6]*a,t[7]=0,t[8]=n[8]*s,t[9]=n[9]*s,t[10]=n[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,r=e.y,a=e.z,s=Math.cos(n),l=Math.sin(n),o=Math.cos(r),c=Math.sin(r),u=Math.cos(a),d=Math.sin(a);if(e.order==="XYZ"){const h=s*u,p=s*d,_=l*u,x=l*d;t[0]=o*u,t[4]=-o*d,t[8]=c,t[1]=p+_*c,t[5]=h-x*c,t[9]=-l*o,t[2]=x-h*c,t[6]=_+p*c,t[10]=s*o}else if(e.order==="YXZ"){const h=o*u,p=o*d,_=c*u,x=c*d;t[0]=h+x*l,t[4]=_*l-p,t[8]=s*c,t[1]=s*d,t[5]=s*u,t[9]=-l,t[2]=p*l-_,t[6]=x+h*l,t[10]=s*o}else if(e.order==="ZXY"){const h=o*u,p=o*d,_=c*u,x=c*d;t[0]=h-x*l,t[4]=-s*d,t[8]=_+p*l,t[1]=p+_*l,t[5]=s*u,t[9]=x-h*l,t[2]=-s*c,t[6]=l,t[10]=s*o}else if(e.order==="ZYX"){const h=s*u,p=s*d,_=l*u,x=l*d;t[0]=o*u,t[4]=_*c-p,t[8]=h*c+x,t[1]=o*d,t[5]=x*c+h,t[9]=p*c-_,t[2]=-c,t[6]=l*o,t[10]=s*o}else if(e.order==="YZX"){const h=s*o,p=s*c,_=l*o,x=l*c;t[0]=o*u,t[4]=x-h*d,t[8]=_*d+p,t[1]=d,t[5]=s*u,t[9]=-l*u,t[2]=-c*u,t[6]=p*d+_,t[10]=h-x*d}else if(e.order==="XZY"){const h=s*o,p=s*c,_=l*o,x=l*c;t[0]=o*u,t[4]=-d,t[8]=c*u,t[1]=h*d+x,t[5]=s*u,t[9]=p*d-_,t[2]=_*d-p,t[6]=l*u,t[10]=x*d+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(_l,e,vl)}lookAt(e,t,n){const r=this.elements;return ht.subVectors(e,t),ht.lengthSq()===0&&(ht.z=1),ht.normalize(),$t.crossVectors(n,ht),$t.lengthSq()===0&&(Math.abs(n.z)===1?ht.x+=1e-4:ht.z+=1e-4,ht.normalize(),$t.crossVectors(n,ht)),$t.normalize(),Wi.crossVectors(ht,$t),r[0]=$t.x,r[4]=Wi.x,r[8]=ht.x,r[1]=$t.y,r[5]=Wi.y,r[9]=ht.y,r[2]=$t.z,r[6]=Wi.z,r[10]=ht.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,a=this.elements,s=n[0],l=n[4],o=n[8],c=n[12],u=n[1],d=n[5],h=n[9],p=n[13],_=n[2],x=n[6],f=n[10],m=n[14],g=n[3],v=n[7],T=n[11],O=n[15],C=r[0],B=r[4],F=r[8],D=r[12],W=r[1],j=r[5],G=r[9],Y=r[13],H=r[2],$=r[6],K=r[10],ie=r[14],ne=r[3],fe=r[7],ve=r[11],ee=r[15];return a[0]=s*C+l*W+o*H+c*ne,a[4]=s*B+l*j+o*$+c*fe,a[8]=s*F+l*G+o*K+c*ve,a[12]=s*D+l*Y+o*ie+c*ee,a[1]=u*C+d*W+h*H+p*ne,a[5]=u*B+d*j+h*$+p*fe,a[9]=u*F+d*G+h*K+p*ve,a[13]=u*D+d*Y+h*ie+p*ee,a[2]=_*C+x*W+f*H+m*ne,a[6]=_*B+x*j+f*$+m*fe,a[10]=_*F+x*G+f*K+m*ve,a[14]=_*D+x*Y+f*ie+m*ee,a[3]=g*C+v*W+T*H+O*ne,a[7]=g*B+v*j+T*$+O*fe,a[11]=g*F+v*G+T*K+O*ve,a[15]=g*D+v*Y+T*ie+O*ee,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],r=e[8],a=e[12],s=e[1],l=e[5],o=e[9],c=e[13],u=e[2],d=e[6],h=e[10],p=e[14];return e[3]*(+a*o*d-r*c*d-a*l*h+n*c*h+r*l*p-n*o*p)+e[7]*(+t*o*p-t*c*h+a*s*h-r*s*p+r*c*u-a*o*u)+e[11]*(+t*c*d-t*l*p-a*s*d+n*s*p+a*l*u-n*c*u)+e[15]*(-r*l*u-t*o*d+t*l*h+r*s*d-n*s*h+n*o*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],a=e[3],s=e[4],l=e[5],o=e[6],c=e[7],u=e[8],d=e[9],h=e[10],p=e[11],_=e[12],x=e[13],f=e[14],m=e[15],g=d*f*c-x*h*c+x*o*p-l*f*p-d*o*m+l*h*m,v=_*h*c-u*f*c-_*o*p+s*f*p+u*o*m-s*h*m,T=u*x*c-_*d*c+_*l*p-s*x*p-u*l*m+s*d*m,O=_*d*o-u*x*o-_*l*h+s*x*h+u*l*f-s*d*f,C=t*g+n*v+r*T+a*O;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const B=1/C;return e[0]=g*B,e[1]=(x*h*a-d*f*a-x*r*p+n*f*p+d*r*m-n*h*m)*B,e[2]=(l*f*a-x*o*a+x*r*c-n*f*c-l*r*m+n*o*m)*B,e[3]=(d*o*a-l*h*a-d*r*c+n*h*c+l*r*p-n*o*p)*B,e[4]=v*B,e[5]=(u*f*a-_*h*a+_*r*p-t*f*p-u*r*m+t*h*m)*B,e[6]=(_*o*a-s*f*a-_*r*c+t*f*c+s*r*m-t*o*m)*B,e[7]=(s*h*a-u*o*a+u*r*c-t*h*c-s*r*p+t*o*p)*B,e[8]=T*B,e[9]=(_*d*a-u*x*a-_*n*p+t*x*p+u*n*m-t*d*m)*B,e[10]=(s*x*a-_*l*a+_*n*c-t*x*c-s*n*m+t*l*m)*B,e[11]=(u*l*a-s*d*a-u*n*c+t*d*c+s*n*p-t*l*p)*B,e[12]=O*B,e[13]=(u*x*r-_*d*r+_*n*h-t*x*h-u*n*f+t*d*f)*B,e[14]=(_*l*r-s*x*r-_*n*o+t*x*o+s*n*f-t*l*f)*B,e[15]=(s*d*r-u*l*r+u*n*o-t*d*o-s*n*h+t*l*h)*B,this}scale(e){const t=this.elements,n=e.x,r=e.y,a=e.z;return t[0]*=n,t[4]*=r,t[8]*=a,t[1]*=n,t[5]*=r,t[9]*=a,t[2]*=n,t[6]*=r,t[10]*=a,t[3]*=n,t[7]*=r,t[11]*=a,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),r=Math.sin(t),a=1-n,s=e.x,l=e.y,o=e.z,c=a*s,u=a*l;return this.set(c*s+n,c*l-r*o,c*o+r*l,0,c*l+r*o,u*l+n,u*o-r*s,0,c*o-r*l,u*o+r*s,a*o*o+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,a,s){return this.set(1,n,a,0,e,1,s,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){const r=this.elements,a=t._x,s=t._y,l=t._z,o=t._w,c=a+a,u=s+s,d=l+l,h=a*c,p=a*u,_=a*d,x=s*u,f=s*d,m=l*d,g=o*c,v=o*u,T=o*d,O=n.x,C=n.y,B=n.z;return r[0]=(1-(x+m))*O,r[1]=(p+T)*O,r[2]=(_-v)*O,r[3]=0,r[4]=(p-T)*C,r[5]=(1-(h+m))*C,r[6]=(f+g)*C,r[7]=0,r[8]=(_+v)*B,r[9]=(f-g)*B,r[10]=(1-(h+x))*B,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){const r=this.elements;let a=Vn.set(r[0],r[1],r[2]).length();const s=Vn.set(r[4],r[5],r[6]).length(),l=Vn.set(r[8],r[9],r[10]).length();this.determinant()<0&&(a=-a),e.x=r[12],e.y=r[13],e.z=r[14],yt.copy(this);const o=1/a,c=1/s,u=1/l;return yt.elements[0]*=o,yt.elements[1]*=o,yt.elements[2]*=o,yt.elements[4]*=c,yt.elements[5]*=c,yt.elements[6]*=c,yt.elements[8]*=u,yt.elements[9]*=u,yt.elements[10]*=u,t.setFromRotationMatrix(yt),n.x=a,n.y=s,n.z=l,this}makePerspective(e,t,n,r,a,s,l=2e3){const o=this.elements,c=2*a/(t-e),u=2*a/(n-r),d=(t+e)/(t-e),h=(n+r)/(n-r);let p,_;if(l===Dn)p=-(s+a)/(s-a),_=-2*s*a/(s-a);else{if(l!==Oi)throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+l);p=-s/(s-a),_=-s*a/(s-a)}return o[0]=c,o[4]=0,o[8]=d,o[12]=0,o[1]=0,o[5]=u,o[9]=h,o[13]=0,o[2]=0,o[6]=0,o[10]=p,o[14]=_,o[3]=0,o[7]=0,o[11]=-1,o[15]=0,this}makeOrthographic(e,t,n,r,a,s,l=2e3){const o=this.elements,c=1/(t-e),u=1/(n-r),d=1/(s-a),h=(t+e)*c,p=(n+r)*u;let _,x;if(l===Dn)_=(s+a)*d,x=-2*d;else{if(l!==Oi)throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+l);_=a*d,x=-1*d}return o[0]=2*c,o[4]=0,o[8]=0,o[12]=-h,o[1]=0,o[5]=2*u,o[9]=0,o[13]=-p,o[2]=0,o[6]=0,o[10]=x,o[14]=-_,o[3]=0,o[7]=0,o[11]=0,o[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const Vn=new b,yt=new Ae,_l=new b(0,0,0),vl=new b(1,1,1),$t=new b,Wi=new b,ht=new b,ms=new Ae,gs=new jt;class Gt{constructor(e=0,t=0,n=0,r=Gt.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const r=e.elements,a=r[0],s=r[4],l=r[8],o=r[1],c=r[5],u=r[9],d=r[2],h=r[6],p=r[10];switch(t){case"XYZ":this._y=Math.asin(rt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-s,a)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-rt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(l,p),this._z=Math.atan2(o,c)):(this._y=Math.atan2(-d,a),this._z=0);break;case"ZXY":this._x=Math.asin(rt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-s,c)):(this._y=0,this._z=Math.atan2(o,a));break;case"ZYX":this._y=Math.asin(-rt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,p),this._z=Math.atan2(o,a)):(this._x=0,this._z=Math.atan2(-s,c));break;case"YZX":this._z=Math.asin(rt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-d,a)):(this._x=0,this._y=Math.atan2(l,p));break;case"XZY":this._z=Math.asin(-rt(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(l,a)):(this._x=Math.atan2(-u,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return ms.makeRotationFromQuaternion(e),this.setFromRotationMatrix(ms,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return gs.setFromEuler(this),this.setFromQuaternion(gs,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Gt.DEFAULT_ORDER="XYZ";class _s{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return!!(this.mask&e.mask)}isEnabled(e){return!!(this.mask&1<<e)}}let xl=0;const vs=new b,kn=new jt,Vt=new Ae,Xi=new b,hi=new b,Ml=new b,Sl=new jt,xs=new b(1,0,0),Ms=new b(0,1,0),Ss=new b(0,0,1),Es={type:"added"},El={type:"removed"},Wn={type:"childadded",child:null},da={type:"childremoved",child:null};class dt extends In{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:xl++}),this.uuid=Nn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=dt.DEFAULT_UP.clone();const e=new b,t=new Gt,n=new jt,r=new b(1,1,1);t._onChange((function(){n.setFromEuler(t,!1)})),n._onChange((function(){t.setFromQuaternion(n,void 0,!1)})),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Ae},normalMatrix:{value:new ye}}),this.matrix=new Ae,this.matrixWorld=new Ae,this.matrixAutoUpdate=dt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new _s,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return kn.setFromAxisAngle(e,t),this.quaternion.multiply(kn),this}rotateOnWorldAxis(e,t){return kn.setFromAxisAngle(e,t),this.quaternion.premultiply(kn),this}rotateX(e){return this.rotateOnAxis(xs,e)}rotateY(e){return this.rotateOnAxis(Ms,e)}rotateZ(e){return this.rotateOnAxis(Ss,e)}translateOnAxis(e,t){return vs.copy(e).applyQuaternion(this.quaternion),this.position.add(vs.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(xs,e)}translateY(e){return this.translateOnAxis(Ms,e)}translateZ(e){return this.translateOnAxis(Ss,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Vt.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Xi.copy(e):Xi.set(e,t,n);const r=this.parent;this.updateWorldMatrix(!0,!1),hi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Vt.lookAt(hi,Xi,this.up):Vt.lookAt(Xi,hi,this.up),this.quaternion.setFromRotationMatrix(Vt),r&&(Vt.extractRotation(r.matrixWorld),kn.setFromRotationMatrix(Vt),this.quaternion.premultiply(kn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Es),Wn.child=e,this.dispatchEvent(Wn),Wn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(El),da.child=e,this.dispatchEvent(da),da.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Vt.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Vt.multiply(e.parent.matrixWorld)),e.applyMatrix4(Vt),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Es),Wn.child=e,this.dispatchEvent(Wn),Wn.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const r=this.children;for(let a=0,s=r.length;a<s;a++)r[a].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(hi,e,Ml),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(hi,Sl,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const r=this.children;for(let a=0,s=r.length;a<s;a++)r[a].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const r={};function a(l,o){return l[o.uuid]===void 0&&(l[o.uuid]=o.toJSON(e)),o.uuid}if(r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map((l=>({boxInitialized:l.boxInitialized,boxMin:l.box.min.toArray(),boxMax:l.box.max.toArray(),sphereInitialized:l.sphereInitialized,sphereRadius:l.sphere.radius,sphereCenter:l.sphere.center.toArray()}))),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()})),this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=a(e.geometries,this.geometry);const l=this.geometry.parameters;if(l!==void 0&&l.shapes!==void 0){const o=l.shapes;if(Array.isArray(o))for(let c=0,u=o.length;c<u;c++){const d=o[c];a(e.shapes,d)}else a(e.shapes,o)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const l=[];for(let o=0,c=this.material.length;o<c;o++)l.push(a(e.materials,this.material[o]));r.material=l}else r.material=a(e.materials,this.material);if(this.children.length>0){r.children=[];for(let l=0;l<this.children.length;l++)r.children.push(this.children[l].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let l=0;l<this.animations.length;l++){const o=this.animations[l];r.animations.push(a(e.animations,o))}}if(t){const l=s(e.geometries),o=s(e.materials),c=s(e.textures),u=s(e.images),d=s(e.shapes),h=s(e.skeletons),p=s(e.animations),_=s(e.nodes);l.length>0&&(n.geometries=l),o.length>0&&(n.materials=o),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),d.length>0&&(n.shapes=d),h.length>0&&(n.skeletons=h),p.length>0&&(n.animations=p),_.length>0&&(n.nodes=_)}return n.object=r,n;function s(l){const o=[];for(const c in l){const u=l[c];delete u.metadata,o.push(u)}return o}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const r=e.children[n];this.add(r.clone())}return this}}dt.DEFAULT_UP=new b(0,1,0),dt.DEFAULT_MATRIX_AUTO_UPDATE=!0,dt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Tt=new b,kt=new b,fa=new b,Wt=new b,Xn=new b,qn=new b,ys=new b,pa=new b,ma=new b,ga=new b,_a=new qe,va=new qe,xa=new qe;class mt{constructor(e=new b,t=new b,n=new b){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Tt.subVectors(e,t),r.cross(Tt);const a=r.lengthSq();return a>0?r.multiplyScalar(1/Math.sqrt(a)):r.set(0,0,0)}static getBarycoord(e,t,n,r,a){Tt.subVectors(r,t),kt.subVectors(n,t),fa.subVectors(e,t);const s=Tt.dot(Tt),l=Tt.dot(kt),o=Tt.dot(fa),c=kt.dot(kt),u=kt.dot(fa),d=s*c-l*l;if(d===0)return a.set(0,0,0),null;const h=1/d,p=(c*o-l*u)*h,_=(s*u-l*o)*h;return a.set(1-p-_,_,p)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Wt)!==null&&Wt.x>=0&&Wt.y>=0&&Wt.x+Wt.y<=1}static getInterpolation(e,t,n,r,a,s,l,o){return this.getBarycoord(e,t,n,r,Wt)===null?(o.x=0,o.y=0,"z"in o&&(o.z=0),"w"in o&&(o.w=0),null):(o.setScalar(0),o.addScaledVector(a,Wt.x),o.addScaledVector(s,Wt.y),o.addScaledVector(l,Wt.z),o)}static getInterpolatedAttribute(e,t,n,r,a,s){return _a.setScalar(0),va.setScalar(0),xa.setScalar(0),_a.fromBufferAttribute(e,t),va.fromBufferAttribute(e,n),xa.fromBufferAttribute(e,r),s.setScalar(0),s.addScaledVector(_a,a.x),s.addScaledVector(va,a.y),s.addScaledVector(xa,a.z),s}static isFrontFacing(e,t,n,r){return Tt.subVectors(n,t),kt.subVectors(e,t),Tt.cross(kt).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Tt.subVectors(this.c,this.b),kt.subVectors(this.a,this.b),.5*Tt.cross(kt).length()}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(.3333333333333333)}getNormal(e){return mt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return mt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,a){return mt.getInterpolation(e,this.a,this.b,this.c,t,n,r,a)}containsPoint(e){return mt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return mt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,r=this.b,a=this.c;let s,l;Xn.subVectors(r,n),qn.subVectors(a,n),pa.subVectors(e,n);const o=Xn.dot(pa),c=qn.dot(pa);if(o<=0&&c<=0)return t.copy(n);ma.subVectors(e,r);const u=Xn.dot(ma),d=qn.dot(ma);if(u>=0&&d<=u)return t.copy(r);const h=o*d-u*c;if(h<=0&&o>=0&&u<=0)return s=o/(o-u),t.copy(n).addScaledVector(Xn,s);ga.subVectors(e,a);const p=Xn.dot(ga),_=qn.dot(ga);if(_>=0&&p<=_)return t.copy(a);const x=p*c-o*_;if(x<=0&&c>=0&&_<=0)return l=c/(c-_),t.copy(n).addScaledVector(qn,l);const f=u*_-p*d;if(f<=0&&d-u>=0&&p-_>=0)return ys.subVectors(a,r),l=(d-u)/(d-u+(p-_)),t.copy(r).addScaledVector(ys,l);const m=1/(f+x+h);return s=x*m,l=h*m,t.copy(n).addScaledVector(Xn,s).addScaledVector(qn,l)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const Ts={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Qt={h:0,s:0,l:0},qi={h:0,s:0,l:0};function Ma(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<.16666666666666666?i+6*(e-i)*t:t<.5?e:t<.6666666666666666?i+6*(e-i)*(.6666666666666666-t):i}class Fe{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=ut){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(255&e)/255,Ne.toWorkingColorSpace(this,t),this}setRGB(e,t,n,r=Ne.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ne.toWorkingColorSpace(this,r),this}setHSL(e,t,n,r=Ne.workingColorSpace){if(e=ia(e,1),t=rt(t,0,1),n=rt(n,0,1),t===0)this.r=this.g=this.b=n;else{const a=n<=.5?n*(1+t):n+t-n*t,s=2*n-a;this.r=Ma(s,a,e+.3333333333333333),this.g=Ma(s,a,e),this.b=Ma(s,a,e-.3333333333333333)}return Ne.toWorkingColorSpace(this,r),this}setStyle(e,t=ut){function n(a){a!==void 0&&parseFloat(a)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let a;const s=r[1],l=r[2];switch(s){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,t);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,t);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(l))return n(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const a=r[1],s=a.length;if(s===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(a,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=ut){const n=Ts[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ft(e.r),this.g=Ft(e.g),this.b=Ft(e.b),this}copyLinearToSRGB(e){return this.r=Fn(e.r),this.g=Fn(e.g),this.b=Fn(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=ut){return Ne.fromWorkingColorSpace(it.copy(this),e),65536*Math.round(rt(255*it.r,0,255))+256*Math.round(rt(255*it.g,0,255))+Math.round(rt(255*it.b,0,255))}getHexString(e=ut){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ne.workingColorSpace){Ne.fromWorkingColorSpace(it.copy(this),t);const n=it.r,r=it.g,a=it.b,s=Math.max(n,r,a),l=Math.min(n,r,a);let o,c;const u=(l+s)/2;if(l===s)o=0,c=0;else{const d=s-l;switch(c=u<=.5?d/(s+l):d/(2-s-l),s){case n:o=(r-a)/d+(r<a?6:0);break;case r:o=(a-n)/d+2;break;case a:o=(n-r)/d+4}o/=6}return e.h=o,e.s=c,e.l=u,e}getRGB(e,t=Ne.workingColorSpace){return Ne.fromWorkingColorSpace(it.copy(this),t),e.r=it.r,e.g=it.g,e.b=it.b,e}getStyle(e=ut){Ne.fromWorkingColorSpace(it.copy(this),e);const t=it.r,n=it.g,r=it.b;return e!==ut?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(255*t)},${Math.round(255*n)},${Math.round(255*r)})`}offsetHSL(e,t,n){return this.getHSL(Qt),this.setHSL(Qt.h+e,Qt.s+t,Qt.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Qt),e.getHSL(qi);const n=oi(Qt.h,qi.h,t),r=oi(Qt.s,qi.s,t),a=oi(Qt.l,qi.l,t);return this.setHSL(n,r,a),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,r=this.b,a=e.elements;return this.r=a[0]*t+a[3]*n+a[6]*r,this.g=a[1]*t+a[4]*n+a[7]*r,this.b=a[2]*t+a[5]*n+a[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const it=new Fe;Fe.NAMES=Ts;let yl=0;class ji extends In{static get type(){return"Material"}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:yl++}),this.uuid=Nn(),this.name="",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=vr,this.blendDst=xr,this.blendEquation=on,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Fe(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Un,this.stencilZFail=Un,this.stencilZPass=Un,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];r!==void 0?r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n:console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`)}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};function r(a){const s=[];for(const l in a){const o=a[l];delete o.metadata,s.push(o)}return s}if(n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==0&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==vr&&(n.blendSrc=this.blendSrc),this.blendDst!==xr&&(n.blendDst=this.blendDst),this.blendEquation!==on&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Un&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Un&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Un&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData),t){const a=r(e.textures),s=r(e.images);a.length>0&&(n.textures=a),s.length>0&&(n.images=s)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const r=t.length;n=new Array(r);for(let a=0;a!==r;++a)n[a]=t[a].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class bs extends ji{static get type(){return"MeshBasicMaterial"}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new Fe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Gt,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}Tl();function Tl(){const i=new ArrayBuffer(4),e=new Float32Array(i),t=new Uint32Array(i),n=new Uint32Array(512),r=new Uint32Array(512);for(let o=0;o<256;++o){const c=o-127;c<-27?(n[o]=0,n[256|o]=32768,r[o]=24,r[256|o]=24):c<-14?(n[o]=1024>>-c-14,n[256|o]=1024>>-c-14|32768,r[o]=-c-1,r[256|o]=-c-1):c<=15?(n[o]=c+15<<10,n[256|o]=c+15<<10|32768,r[o]=13,r[256|o]=13):c<128?(n[o]=31744,n[256|o]=64512,r[o]=24,r[256|o]=24):(n[o]=31744,n[256|o]=64512,r[o]=13,r[256|o]=13)}const a=new Uint32Array(2048),s=new Uint32Array(64),l=new Uint32Array(64);for(let o=1;o<1024;++o){let c=o<<13,u=0;for(;!(8388608&c);)c<<=1,u-=8388608;c&=-8388609,u+=947912704,a[o]=c|u}for(let o=1024;o<2048;++o)a[o]=939524096+(o-1024<<13);for(let o=1;o<31;++o)s[o]=o<<23;s[31]=1199570944,s[32]=2147483648;for(let o=33;o<63;++o)s[o]=2147483648+(o-32<<23);s[63]=3347054592;for(let o=1;o<64;++o)o!==32&&(l[o]=1024);return{floatView:e,uint32View:t,baseTable:n,shiftTable:r,mantissaTable:a,exponentTable:s,offsetTable:l}}const Ye=new b,Yi=new Oe;class bt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=ns,this.updateRanges=[],this.gpuType=Ot,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,a=this.itemSize;r<a;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Yi.fromBufferAttribute(this,t),Yi.applyMatrix3(e),this.setXY(t,Yi.x,Yi.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Ye.fromBufferAttribute(this,t),Ye.applyMatrix3(e),this.setXYZ(t,Ye.x,Ye.y,Ye.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Ye.fromBufferAttribute(this,t),Ye.applyMatrix4(e),this.setXYZ(t,Ye.x,Ye.y,Ye.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Ye.fromBufferAttribute(this,t),Ye.applyNormalMatrix(e),this.setXYZ(t,Ye.x,Ye.y,Ye.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Ye.fromBufferAttribute(this,t),Ye.transformDirection(e),this.setXYZ(t,Ye.x,Ye.y,Ye.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=On(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=at(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=On(t,this.array)),t}setX(e,t){return this.normalized&&(t=at(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=On(t,this.array)),t}setY(e,t){return this.normalized&&(t=at(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=On(t,this.array)),t}setZ(e,t){return this.normalized&&(t=at(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=On(t,this.array)),t}setW(e,t){return this.normalized&&(t=at(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=at(t,this.array),n=at(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=at(t,this.array),n=at(n,this.array),r=at(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,a){return e*=this.itemSize,this.normalized&&(t=at(t,this.array),n=at(n,this.array),r=at(r,this.array),a=at(a,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=a,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==ns&&(e.usage=this.usage),e}}class ws extends bt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class As extends bt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class mn extends bt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let bl=0;const gt=new Ae,Sa=new dt,jn=new b,ft=new Yt,di=new Yt,et=new b;class en extends In{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:bl++}),this.uuid=Nn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(as(e)?As:ws)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const a=new ye().getNormalMatrix(e);n.applyNormalMatrix(a),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return gt.makeRotationFromQuaternion(e),this.applyMatrix4(gt),this}rotateX(e){return gt.makeRotationX(e),this.applyMatrix4(gt),this}rotateY(e){return gt.makeRotationY(e),this.applyMatrix4(gt),this}rotateZ(e){return gt.makeRotationZ(e),this.applyMatrix4(gt),this}translate(e,t,n){return gt.makeTranslation(e,t,n),this.applyMatrix4(gt),this}scale(e,t,n){return gt.makeScale(e,t,n),this.applyMatrix4(gt),this}lookAt(e){return Sa.lookAt(e),Sa.updateMatrix(),this.applyMatrix4(Sa.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(jn).negate(),this.translate(jn.x,jn.y,jn.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let r=0,a=e.length;r<a;r++){const s=e[r];n.push(s.x,s.y,s.z||0)}this.setAttribute("position",new mn(n,3))}else{for(let n=0,r=t.count;n<r;n++){const a=e[n];t.setXYZ(n,a.x,a.y,a.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Yt);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)return console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),void this.boundingBox.set(new b(-1/0,-1/0,-1/0),new b(1/0,1/0,1/0));if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){const a=t[n];ft.setFromBufferAttribute(a),this.morphTargetsRelative?(et.addVectors(this.boundingBox.min,ft.min),this.boundingBox.expandByPoint(et),et.addVectors(this.boundingBox.max,ft.max),this.boundingBox.expandByPoint(et)):(this.boundingBox.expandByPoint(ft.min),this.boundingBox.expandByPoint(ft.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new zt);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)return console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),void this.boundingSphere.set(new b,1/0);if(e){const n=this.boundingSphere.center;if(ft.setFromBufferAttribute(e),t)for(let a=0,s=t.length;a<s;a++){const l=t[a];di.setFromBufferAttribute(l),this.morphTargetsRelative?(et.addVectors(ft.min,di.min),ft.expandByPoint(et),et.addVectors(ft.max,di.max),ft.expandByPoint(et)):(ft.expandByPoint(di.min),ft.expandByPoint(di.max))}ft.getCenter(n);let r=0;for(let a=0,s=e.count;a<s;a++)et.fromBufferAttribute(e,a),r=Math.max(r,n.distanceToSquared(et));if(t)for(let a=0,s=t.length;a<s;a++){const l=t[a],o=this.morphTargetsRelative;for(let c=0,u=l.count;c<u;c++)et.fromBufferAttribute(l,c),o&&(jn.fromBufferAttribute(e,c),et.add(jn)),r=Math.max(r,n.distanceToSquared(et))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0)return void console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");const n=t.position,r=t.normal,a=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new bt(new Float32Array(4*n.count),4));const s=this.getAttribute("tangent"),l=[],o=[];for(let F=0;F<n.count;F++)l[F]=new b,o[F]=new b;const c=new b,u=new b,d=new b,h=new Oe,p=new Oe,_=new Oe,x=new b,f=new b;function m(F,D,W){c.fromBufferAttribute(n,F),u.fromBufferAttribute(n,D),d.fromBufferAttribute(n,W),h.fromBufferAttribute(a,F),p.fromBufferAttribute(a,D),_.fromBufferAttribute(a,W),u.sub(c),d.sub(c),p.sub(h),_.sub(h);const j=1/(p.x*_.y-_.x*p.y);isFinite(j)&&(x.copy(u).multiplyScalar(_.y).addScaledVector(d,-p.y).multiplyScalar(j),f.copy(d).multiplyScalar(p.x).addScaledVector(u,-_.x).multiplyScalar(j),l[F].add(x),l[D].add(x),l[W].add(x),o[F].add(f),o[D].add(f),o[W].add(f))}let g=this.groups;g.length===0&&(g=[{start:0,count:e.count}]);for(let F=0,D=g.length;F<D;++F){const W=g[F],j=W.start;for(let G=j,Y=j+W.count;G<Y;G+=3)m(e.getX(G+0),e.getX(G+1),e.getX(G+2))}const v=new b,T=new b,O=new b,C=new b;function B(F){O.fromBufferAttribute(r,F),C.copy(O);const D=l[F];v.copy(D),v.sub(O.multiplyScalar(O.dot(D))).normalize(),T.crossVectors(C,D);const W=T.dot(o[F])<0?-1:1;s.setXYZW(F,v.x,v.y,v.z,W)}for(let F=0,D=g.length;F<D;++F){const W=g[F],j=W.start;for(let G=j,Y=j+W.count;G<Y;G+=3)B(e.getX(G+0)),B(e.getX(G+1)),B(e.getX(G+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new bt(new Float32Array(3*t.count),3),this.setAttribute("normal",n);else for(let h=0,p=n.count;h<p;h++)n.setXYZ(h,0,0,0);const r=new b,a=new b,s=new b,l=new b,o=new b,c=new b,u=new b,d=new b;if(e)for(let h=0,p=e.count;h<p;h+=3){const _=e.getX(h+0),x=e.getX(h+1),f=e.getX(h+2);r.fromBufferAttribute(t,_),a.fromBufferAttribute(t,x),s.fromBufferAttribute(t,f),u.subVectors(s,a),d.subVectors(r,a),u.cross(d),l.fromBufferAttribute(n,_),o.fromBufferAttribute(n,x),c.fromBufferAttribute(n,f),l.add(u),o.add(u),c.add(u),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(x,o.x,o.y,o.z),n.setXYZ(f,c.x,c.y,c.z)}else for(let h=0,p=t.count;h<p;h+=3)r.fromBufferAttribute(t,h+0),a.fromBufferAttribute(t,h+1),s.fromBufferAttribute(t,h+2),u.subVectors(s,a),d.subVectors(r,a),u.cross(d),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)et.fromBufferAttribute(e,t),et.normalize(),e.setXYZ(t,et.x,et.y,et.z)}toNonIndexed(){function e(l,o){const c=l.array,u=l.itemSize,d=l.normalized,h=new c.constructor(o.length*u);let p=0,_=0;for(let x=0,f=o.length;x<f;x++){p=l.isInterleavedBufferAttribute?o[x]*l.data.stride+l.offset:o[x]*u;for(let m=0;m<u;m++)h[_++]=c[p++]}return new bt(h,u,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new en,n=this.index.array,r=this.attributes;for(const l in r){const o=e(r[l],n);t.setAttribute(l,o)}const a=this.morphAttributes;for(const l in a){const o=[],c=a[l];for(let u=0,d=c.length;u<d;u++){const h=e(c[u],n);o.push(h)}t.morphAttributes[l]=o}t.morphTargetsRelative=this.morphTargetsRelative;const s=this.groups;for(let l=0,o=s.length;l<o;l++){const c=s[l];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const o=this.parameters;for(const c in o)o[c]!==void 0&&(e[c]=o[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const o in n){const c=n[o];e.data.attributes[o]=c.toJSON(e.data)}const r={};let a=!1;for(const o in this.morphAttributes){const c=this.morphAttributes[o],u=[];for(let d=0,h=c.length;d<h;d++){const p=c[d];u.push(p.toJSON(e.data))}u.length>0&&(r[o]=u,a=!0)}a&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));const l=this.boundingSphere;return l!==null&&(e.data.boundingSphere={center:l.center.toArray(),radius:l.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const r=e.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(t))}const a=e.morphAttributes;for(const c in a){const u=[],d=a[c];for(let h=0,p=d.length;h<p;h++)u.push(d[h].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const s=e.groups;for(let c=0,u=s.length;c<u;c++){const d=s[c];this.addGroup(d.start,d.count,d.materialIndex)}const l=e.boundingBox;l!==null&&(this.boundingBox=l.clone());const o=e.boundingSphere;return o!==null&&(this.boundingSphere=o.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Rs=new Ae,gn=new ki,Ki=new zt,Cs=new b,Zi=new b,Ji=new b,$i=new b,Ea=new b,Qi=new b,Ps=new b,er=new b;class _t extends dt{constructor(e=new en,t=new bs){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){const n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=n.length;r<a;r++){const s=n[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[s]=r}}}}getVertexPosition(e,t){const n=this.geometry,r=n.attributes.position,a=n.morphAttributes.position,s=n.morphTargetsRelative;t.fromBufferAttribute(r,e);const l=this.morphTargetInfluences;if(a&&l){Qi.set(0,0,0);for(let o=0,c=a.length;o<c;o++){const u=l[o],d=a[o];u!==0&&(Ea.fromBufferAttribute(d,e),s?Qi.addScaledVector(Ea,u):Qi.addScaledVector(Ea.sub(t),u))}t.add(Qi)}return t}raycast(e,t){const n=this.geometry,r=this.material,a=this.matrixWorld;if(r!==void 0){if(n.boundingSphere===null&&n.computeBoundingSphere(),Ki.copy(n.boundingSphere),Ki.applyMatrix4(a),gn.copy(e.ray).recast(e.near),Ki.containsPoint(gn.origin)===!1&&(gn.intersectSphere(Ki,Cs)===null||gn.origin.distanceToSquared(Cs)>(e.far-e.near)**2))return;Rs.copy(a).invert(),gn.copy(e.ray).applyMatrix4(Rs),n.boundingBox!==null&&gn.intersectsBox(n.boundingBox)===!1||this._computeIntersections(e,t,gn)}}_computeIntersections(e,t,n){let r;const a=this.geometry,s=this.material,l=a.index,o=a.attributes.position,c=a.attributes.uv,u=a.attributes.uv1,d=a.attributes.normal,h=a.groups,p=a.drawRange;if(l!==null)if(Array.isArray(s))for(let _=0,x=h.length;_<x;_++){const f=h[_],m=s[f.materialIndex];for(let g=Math.max(f.start,p.start),v=Math.min(l.count,Math.min(f.start+f.count,p.start+p.count));g<v;g+=3)r=tr(this,m,e,n,c,u,d,l.getX(g),l.getX(g+1),l.getX(g+2)),r&&(r.faceIndex=Math.floor(g/3),r.face.materialIndex=f.materialIndex,t.push(r))}else for(let _=Math.max(0,p.start),x=Math.min(l.count,p.start+p.count);_<x;_+=3)r=tr(this,s,e,n,c,u,d,l.getX(_),l.getX(_+1),l.getX(_+2)),r&&(r.faceIndex=Math.floor(_/3),t.push(r));else if(o!==void 0)if(Array.isArray(s))for(let _=0,x=h.length;_<x;_++){const f=h[_],m=s[f.materialIndex];for(let g=Math.max(f.start,p.start),v=Math.min(o.count,Math.min(f.start+f.count,p.start+p.count));g<v;g+=3)r=tr(this,m,e,n,c,u,d,g,g+1,g+2),r&&(r.faceIndex=Math.floor(g/3),r.face.materialIndex=f.materialIndex,t.push(r))}else for(let _=Math.max(0,p.start),x=Math.min(o.count,p.start+p.count);_<x;_+=3)r=tr(this,s,e,n,c,u,d,_,_+1,_+2),r&&(r.faceIndex=Math.floor(_/3),t.push(r))}}function tr(i,e,t,n,r,a,s,l,o,c){i.getVertexPosition(l,Zi),i.getVertexPosition(o,Ji),i.getVertexPosition(c,$i);const u=(function(d,h,p,_,x,f,m,g){let v;if(v=h.side===1?_.intersectTriangle(m,f,x,!0,g):_.intersectTriangle(x,f,m,h.side===0,g),v===null)return null;er.copy(g),er.applyMatrix4(d.matrixWorld);const T=p.ray.origin.distanceTo(er);return T<p.near||T>p.far?null:{distance:T,point:er.clone(),object:d}})(i,e,t,n,Zi,Ji,$i,Ps);if(u){const d=new b;mt.getBarycoord(Ps,Zi,Ji,$i,d),r&&(u.uv=mt.getInterpolatedAttribute(r,l,o,c,d,new Oe)),a&&(u.uv1=mt.getInterpolatedAttribute(a,l,o,c,d,new Oe)),s&&(u.normal=mt.getInterpolatedAttribute(s,l,o,c,d,new b),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const h={a:l,b:o,c,normal:new b,materialIndex:0};mt.getNormal(Zi,Ji,$i,h.normal),u.face=h,u.barycoord=d}return u}class fi extends en{constructor(e=1,t=1,n=1,r=1,a=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:a,depthSegments:s};const l=this;r=Math.floor(r),a=Math.floor(a),s=Math.floor(s);const o=[],c=[],u=[],d=[];let h=0,p=0;function _(x,f,m,g,v,T,O,C,B,F,D){const W=T/B,j=O/F,G=T/2,Y=O/2,H=C/2,$=B+1,K=F+1;let ie=0,ne=0;const fe=new b;for(let ve=0;ve<K;ve++){const ee=ve*j-Y;for(let te=0;te<$;te++){const oe=te*W-G;fe[x]=oe*g,fe[f]=ee*v,fe[m]=H,c.push(fe.x,fe.y,fe.z),fe[x]=0,fe[f]=0,fe[m]=C>0?1:-1,u.push(fe.x,fe.y,fe.z),d.push(te/B),d.push(1-ve/F),ie+=1}}for(let ve=0;ve<F;ve++)for(let ee=0;ee<B;ee++){const te=h+ee+$*ve,oe=h+ee+$*(ve+1),me=h+(ee+1)+$*(ve+1),ce=h+(ee+1)+$*ve;o.push(te,oe,ce),o.push(oe,me,ce),ne+=6}l.addGroup(p,ne,D),p+=ne,h+=ie}_("z","y","x",-1,-1,n,t,e,s,a,0),_("z","y","x",1,-1,n,t,-e,s,a,1),_("x","z","y",1,1,e,n,t,r,s,2),_("x","z","y",1,-1,e,n,-t,r,s,3),_("x","y","z",1,-1,e,t,n,r,a,4),_("x","y","z",-1,-1,e,t,-n,r,a,5),this.setIndex(o),this.setAttribute("position",new mn(c,3)),this.setAttribute("normal",new mn(u,3)),this.setAttribute("uv",new mn(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new fi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function Yn(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const r=i[t][n];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone():Array.isArray(r)?e[t][n]=r.slice():e[t][n]=r}}return e}function ot(i){const e={};for(let t=0;t<i.length;t++){const n=Yn(i[t]);for(const r in n)e[r]=n[r]}return e}function Ls(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ne.workingColorSpace}const wl={clone:Yn,merge:ot};class Xt extends ji{static get type(){return"ShaderMaterial"}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,this.fragmentShader=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Yn(e.uniforms),this.uniformsGroups=(function(t){const n=[];for(let r=0;r<t.length;r++)n.push(t[r].clone());return n})(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class ya extends dt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ae,this.projectionMatrix=new Ae,this.projectionMatrixInverse=new Ae,this.coordinateSystem=Dn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const tn=new b,Us=new Oe,Ds=new Oe;class vt extends ya{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=2*si*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(.5*ai*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return 2*si*Math.atan(Math.tan(.5*ai*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){tn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(tn.x,tn.y).multiplyScalar(-e/tn.z),tn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(tn.x,tn.y).multiplyScalar(-e/tn.z)}getViewSize(e,t){return this.getViewBounds(e,Us,Ds),t.subVectors(Ds,Us)}setViewOffset(e,t,n,r,a,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(.5*ai*this.fov)/this.zoom,n=2*t,r=this.aspect*n,a=-.5*r;const s=this.view;if(this.view!==null&&this.view.enabled){const o=s.fullWidth,c=s.fullHeight;a+=s.offsetX*r/o,t-=s.offsetY*n/c,r*=s.width/o,n*=s.height/c}const l=this.filmOffset;l!==0&&(a+=e*l/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+r,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Kn=-90;class Al extends dt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new vt(Kn,1,e,t);r.layers=this.layers,this.add(r);const a=new vt(Kn,1,e,t);a.layers=this.layers,this.add(a);const s=new vt(Kn,1,e,t);s.layers=this.layers,this.add(s);const l=new vt(Kn,1,e,t);l.layers=this.layers,this.add(l);const o=new vt(Kn,1,e,t);o.layers=this.layers,this.add(o);const c=new vt(Kn,1,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,r,a,s,l,o]=t;for(const c of t)this.remove(c);if(e===Dn)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),l.up.set(0,1,0),l.lookAt(0,0,1),o.up.set(0,1,0),o.lookAt(0,0,-1);else{if(e!==Oi)throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),l.up.set(0,-1,0),l.lookAt(0,0,1),o.up.set(0,-1,0),o.lookAt(0,0,-1)}for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[a,s,l,o,c,u]=this.children,d=e.getRenderTarget(),h=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,r),e.render(t,a),e.setRenderTarget(n,1,r),e.render(t,s),e.setRenderTarget(n,2,r),e.render(t,l),e.setRenderTarget(n,3,r),e.render(t,o),e.setRenderTarget(n,4,r),e.render(t,c),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,r),e.render(t,u),e.setRenderTarget(d,h,p),e.xr.enabled=_,n.texture.needsPMREMUpdate=!0}}class Is extends st{constructor(e,t,n,r,a,s,l,o,c,u){super(e=e!==void 0?e:[],t=t!==void 0?t:An,n,r,a,s,l,o,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Rl extends dn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Is(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0&&t.generateMipmaps,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Pt}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new fi(5,5,5),a=new Xt({name:"CubemapFromEquirect",uniforms:Yn(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});a.uniforms.tEquirect.value=t;const s=new _t(r,a),l=t.minFilter;return t.minFilter===cn&&(t.minFilter=Pt),new Al(1,10,this).update(e,s),t.minFilter=l,s.geometry.dispose(),s.material.dispose(),this}clear(e,t,n,r){const a=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,n,r);e.setRenderTarget(a)}}const Ta=new b,Cl=new b,Pl=new ye;class _n{constructor(e=new b(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const r=Ta.subVectors(n,t).cross(Cl.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(Ta),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/r;return a<0||a>1?null:t.copy(e.start).addScaledVector(n,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Pl.getNormalMatrix(e),r=this.coplanarPoint(Ta).applyMatrix4(e),a=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(a),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const vn=new zt,nr=new b;class ba{constructor(e=new _n,t=new _n,n=new _n,r=new _n,a=new _n,s=new _n){this.planes=[e,t,n,r,a,s]}set(e,t,n,r,a,s){const l=this.planes;return l[0].copy(e),l[1].copy(t),l[2].copy(n),l[3].copy(r),l[4].copy(a),l[5].copy(s),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=2e3){const n=this.planes,r=e.elements,a=r[0],s=r[1],l=r[2],o=r[3],c=r[4],u=r[5],d=r[6],h=r[7],p=r[8],_=r[9],x=r[10],f=r[11],m=r[12],g=r[13],v=r[14],T=r[15];if(n[0].setComponents(o-a,h-c,f-p,T-m).normalize(),n[1].setComponents(o+a,h+c,f+p,T+m).normalize(),n[2].setComponents(o+s,h+u,f+_,T+g).normalize(),n[3].setComponents(o-s,h-u,f-_,T-g).normalize(),n[4].setComponents(o-l,h-d,f-x,T-v).normalize(),t===Dn)n[5].setComponents(o+l,h+d,f+x,T+v).normalize();else{if(t!==Oi)throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);n[5].setComponents(l,d,x,v).normalize()}return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),vn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),vn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(vn)}intersectsSprite(e){return vn.center.set(0,0,0),vn.radius=.7071067811865476,vn.applyMatrix4(e.matrixWorld),this.intersectsSphere(vn)}intersectsSphere(e){const t=this.planes,n=e.center,r=-e.radius;for(let a=0;a<6;a++)if(t[a].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const r=t[n];if(nr.x=r.normal.x>0?e.max.x:e.min.x,nr.y=r.normal.y>0?e.max.y:e.min.y,nr.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(nr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Ns(){let i=null,e=!1,t=null,n=null;function r(a,s){t(a,s),n=i.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(a){t=a},setContext:function(a){i=a}}}function Ll(i){const e=new WeakMap;return{get:function(t){return t.isInterleavedBufferAttribute&&(t=t.data),e.get(t)},remove:function(t){t.isInterleavedBufferAttribute&&(t=t.data);const n=e.get(t);n&&(i.deleteBuffer(n.buffer),e.delete(t))},update:function(t,n){if(t.isInterleavedBufferAttribute&&(t=t.data),t.isGLBufferAttribute){const a=e.get(t);return void((!a||a.version<t.version)&&e.set(t,{buffer:t.buffer,type:t.type,bytesPerElement:t.elementSize,version:t.version}))}const r=e.get(t);if(r===void 0)e.set(t,(function(a,s){const l=a.array,o=a.usage,c=l.byteLength,u=i.createBuffer();let d;if(i.bindBuffer(s,u),i.bufferData(s,l,o),a.onUploadCallback(),l instanceof Float32Array)d=i.FLOAT;else if(l instanceof Uint16Array)d=a.isFloat16BufferAttribute?i.HALF_FLOAT:i.UNSIGNED_SHORT;else if(l instanceof Int16Array)d=i.SHORT;else if(l instanceof Uint32Array)d=i.UNSIGNED_INT;else if(l instanceof Int32Array)d=i.INT;else if(l instanceof Int8Array)d=i.BYTE;else if(l instanceof Uint8Array)d=i.UNSIGNED_BYTE;else{if(!(l instanceof Uint8ClampedArray))throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);d=i.UNSIGNED_BYTE}return{buffer:u,type:d,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:c}})(t,n));else if(r.version<t.version){if(r.size!==t.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");(function(a,s,l){const o=s.array,c=s.updateRanges;if(i.bindBuffer(l,a),c.length===0)i.bufferSubData(l,0,o);else{c.sort(((d,h)=>d.start-h.start));let u=0;for(let d=1;d<c.length;d++){const h=c[u],p=c[d];p.start<=h.start+h.count+1?h.count=Math.max(h.count,p.start+p.count-h.start):(++u,c[u]=p)}c.length=u+1;for(let d=0,h=c.length;d<h;d++){const p=c[d];i.bufferSubData(l,p.start*o.BYTES_PER_ELEMENT,o,p.start,p.count)}s.clearUpdateRanges()}s.onUploadCallback()})(r.buffer,t,n),r.version=t.version}}}}class pi extends en{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};const a=e/2,s=t/2,l=Math.floor(n),o=Math.floor(r),c=l+1,u=o+1,d=e/l,h=t/o,p=[],_=[],x=[],f=[];for(let m=0;m<u;m++){const g=m*h-s;for(let v=0;v<c;v++){const T=v*d-a;_.push(T,-g,0),x.push(0,0,1),f.push(v/l),f.push(1-m/o)}}for(let m=0;m<o;m++)for(let g=0;g<l;g++){const v=g+c*m,T=g+c*(m+1),O=g+1+c*(m+1),C=g+1+c*m;p.push(v,T,C),p.push(T,O,C)}this.setIndex(p),this.setAttribute("position",new mn(_,3)),this.setAttribute("normal",new mn(x,3)),this.setAttribute("uv",new mn(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new pi(e.width,e.height,e.widthSegments,e.heightSegments)}}const be={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:"gl_FragColor = linearToOutputTexel( gl_FragColor );",colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distanceRGBA_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distanceRGBA_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},se={common:{diffuse:{value:new Fe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new ye},alphaMap:{value:null},alphaMapTransform:{value:new ye},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new ye}},envmap:{envMap:{value:null},envMapRotation:{value:new ye},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new ye}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new ye}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new ye},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new ye},normalScale:{value:new Oe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new ye},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new ye}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new ye}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new ye}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Fe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Fe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new ye},alphaTest:{value:0},uvTransform:{value:new ye}},sprite:{diffuse:{value:new Fe(16777215)},opacity:{value:1},center:{value:new Oe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new ye},alphaMap:{value:null},alphaMapTransform:{value:new ye},alphaTest:{value:0}}},Ut={basic:{uniforms:ot([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.fog]),vertexShader:be.meshbasic_vert,fragmentShader:be.meshbasic_frag},lambert:{uniforms:ot([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new Fe(0)}}]),vertexShader:be.meshlambert_vert,fragmentShader:be.meshlambert_frag},phong:{uniforms:ot([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new Fe(0)},specular:{value:new Fe(1118481)},shininess:{value:30}}]),vertexShader:be.meshphong_vert,fragmentShader:be.meshphong_frag},standard:{uniforms:ot([se.common,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.roughnessmap,se.metalnessmap,se.fog,se.lights,{emissive:{value:new Fe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:be.meshphysical_vert,fragmentShader:be.meshphysical_frag},toon:{uniforms:ot([se.common,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.gradientmap,se.fog,se.lights,{emissive:{value:new Fe(0)}}]),vertexShader:be.meshtoon_vert,fragmentShader:be.meshtoon_frag},matcap:{uniforms:ot([se.common,se.bumpmap,se.normalmap,se.displacementmap,se.fog,{matcap:{value:null}}]),vertexShader:be.meshmatcap_vert,fragmentShader:be.meshmatcap_frag},points:{uniforms:ot([se.points,se.fog]),vertexShader:be.points_vert,fragmentShader:be.points_frag},dashed:{uniforms:ot([se.common,se.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:be.linedashed_vert,fragmentShader:be.linedashed_frag},depth:{uniforms:ot([se.common,se.displacementmap]),vertexShader:be.depth_vert,fragmentShader:be.depth_frag},normal:{uniforms:ot([se.common,se.bumpmap,se.normalmap,se.displacementmap,{opacity:{value:1}}]),vertexShader:be.meshnormal_vert,fragmentShader:be.meshnormal_frag},sprite:{uniforms:ot([se.sprite,se.fog]),vertexShader:be.sprite_vert,fragmentShader:be.sprite_frag},background:{uniforms:{uvTransform:{value:new ye},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:be.background_vert,fragmentShader:be.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new ye}},vertexShader:be.backgroundCube_vert,fragmentShader:be.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:be.cube_vert,fragmentShader:be.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:be.equirect_vert,fragmentShader:be.equirect_frag},distanceRGBA:{uniforms:ot([se.common,se.displacementmap,{referencePosition:{value:new b},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:be.distanceRGBA_vert,fragmentShader:be.distanceRGBA_frag},shadow:{uniforms:ot([se.lights,se.fog,{color:{value:new Fe(0)},opacity:{value:1}}]),vertexShader:be.shadow_vert,fragmentShader:be.shadow_frag}};Ut.physical={uniforms:ot([Ut.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new ye},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new ye},clearcoatNormalScale:{value:new Oe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new ye},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new ye},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new ye},sheen:{value:0},sheenColor:{value:new Fe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new ye},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new ye},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new ye},transmissionSamplerSize:{value:new Oe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new ye},attenuationDistance:{value:0},attenuationColor:{value:new Fe(0)},specularColor:{value:new Fe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new ye},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new ye},anisotropyVector:{value:new Oe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new ye}}]),vertexShader:be.meshphysical_vert,fragmentShader:be.meshphysical_frag};const ir={r:0,b:0,g:0},xn=new Gt,Ul=new Ae;function Dl(i,e,t,n,r,a,s){const l=new Fe(0);let o,c,u=a===!0?0:1,d=null,h=0,p=null;function _(f){let m=f.isScene===!0?f.background:null;return m&&m.isTexture&&(m=(f.backgroundBlurriness>0?t:e).get(m)),m}function x(f,m){f.getRGB(ir,Ls(i)),n.buffers.color.setClear(ir.r,ir.g,ir.b,m,s)}return{getClearColor:function(){return l},setClearColor:function(f,m=1){l.set(f),u=m,x(l,u)},getClearAlpha:function(){return u},setClearAlpha:function(f){u=f,x(l,u)},render:function(f){let m=!1;const g=_(f);g===null?x(l,u):g&&g.isColor&&(x(g,1),m=!0);const v=i.xr.getEnvironmentBlendMode();v==="additive"?n.buffers.color.setClear(0,0,0,1,s):v==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,s),(i.autoClear||m)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))},addToRenderList:function(f,m){const g=_(m);g&&(g.isCubeTexture||g.mapping===Ri)?(c===void 0&&(c=new _t(new fi(1,1,1),new Xt({name:"BackgroundCubeMaterial",uniforms:Yn(Ut.backgroundCube.uniforms),vertexShader:Ut.backgroundCube.vertexShader,fragmentShader:Ut.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(v,T,O){this.matrixWorld.copyPosition(O.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(c)),xn.copy(m.backgroundRotation),xn.x*=-1,xn.y*=-1,xn.z*=-1,g.isCubeTexture&&g.isRenderTargetTexture===!1&&(xn.y*=-1,xn.z*=-1),c.material.uniforms.envMap.value=g,c.material.uniforms.flipEnvMap.value=g.isCubeTexture&&g.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=m.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Ul.makeRotationFromEuler(xn)),c.material.toneMapped=Ne.getTransfer(g.colorSpace)!==Ge,d===g&&h===g.version&&p===i.toneMapping||(c.material.needsUpdate=!0,d=g,h=g.version,p=i.toneMapping),c.layers.enableAll(),f.unshift(c,c.geometry,c.material,0,0,null)):g&&g.isTexture&&(o===void 0&&(o=new _t(new pi(2,2),new Xt({name:"BackgroundMaterial",uniforms:Yn(Ut.background.uniforms),vertexShader:Ut.background.vertexShader,fragmentShader:Ut.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1})),o.geometry.deleteAttribute("normal"),Object.defineProperty(o.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(o)),o.material.uniforms.t2D.value=g,o.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,o.material.toneMapped=Ne.getTransfer(g.colorSpace)!==Ge,g.matrixAutoUpdate===!0&&g.updateMatrix(),o.material.uniforms.uvTransform.value.copy(g.matrix),d===g&&h===g.version&&p===i.toneMapping||(o.material.needsUpdate=!0,d=g,h=g.version,p=i.toneMapping),o.layers.enableAll(),f.unshift(o,o.geometry,o.material,0,0,null))}}}function Il(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=c(null);let a=r,s=!1;function l(m){return i.bindVertexArray(m)}function o(m){return i.deleteVertexArray(m)}function c(m){const g=[],v=[],T=[];for(let O=0;O<t;O++)g[O]=0,v[O]=0,T[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:g,enabledAttributes:v,attributeDivisors:T,object:m,attributes:{},index:null}}function u(){const m=a.newAttributes;for(let g=0,v=m.length;g<v;g++)m[g]=0}function d(m){h(m,0)}function h(m,g){const v=a.newAttributes,T=a.enabledAttributes,O=a.attributeDivisors;v[m]=1,T[m]===0&&(i.enableVertexAttribArray(m),T[m]=1),O[m]!==g&&(i.vertexAttribDivisor(m,g),O[m]=g)}function p(){const m=a.newAttributes,g=a.enabledAttributes;for(let v=0,T=g.length;v<T;v++)g[v]!==m[v]&&(i.disableVertexAttribArray(v),g[v]=0)}function _(m,g,v,T,O,C,B){B===!0?i.vertexAttribIPointer(m,g,v,O,C):i.vertexAttribPointer(m,g,v,T,O,C)}function x(){f(),s=!0,a!==r&&(a=r,l(a.object))}function f(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:function(m,g,v,T,O){let C=!1;const B=(function(F,D,W){const j=W.wireframe===!0;let G=n[F.id];G===void 0&&(G={},n[F.id]=G);let Y=G[D.id];Y===void 0&&(Y={},G[D.id]=Y);let H=Y[j];return H===void 0&&(H=c(i.createVertexArray()),Y[j]=H),H})(T,v,g);a!==B&&(a=B,l(a.object)),C=(function(F,D,W,j){const G=a.attributes,Y=D.attributes;let H=0;const $=W.getAttributes();for(const K in $)if($[K].location>=0){const ie=G[K];let ne=Y[K];if(ne===void 0&&(K==="instanceMatrix"&&F.instanceMatrix&&(ne=F.instanceMatrix),K==="instanceColor"&&F.instanceColor&&(ne=F.instanceColor)),ie===void 0||ie.attribute!==ne||ne&&ie.data!==ne.data)return!0;H++}return a.attributesNum!==H||a.index!==j})(m,T,v,O),C&&(function(F,D,W,j){const G={},Y=D.attributes;let H=0;const $=W.getAttributes();for(const K in $)if($[K].location>=0){let ie=Y[K];ie===void 0&&(K==="instanceMatrix"&&F.instanceMatrix&&(ie=F.instanceMatrix),K==="instanceColor"&&F.instanceColor&&(ie=F.instanceColor));const ne={};ne.attribute=ie,ie&&ie.data&&(ne.data=ie.data),G[K]=ne,H++}a.attributes=G,a.attributesNum=H,a.index=j})(m,T,v,O),O!==null&&e.update(O,i.ELEMENT_ARRAY_BUFFER),(C||s)&&(s=!1,(function(F,D,W,j){u();const G=j.attributes,Y=W.getAttributes(),H=D.defaultAttributeValues;for(const $ in Y){const K=Y[$];if(K.location>=0){let ie=G[$];if(ie===void 0&&($==="instanceMatrix"&&F.instanceMatrix&&(ie=F.instanceMatrix),$==="instanceColor"&&F.instanceColor&&(ie=F.instanceColor)),ie!==void 0){const ne=ie.normalized,fe=ie.itemSize,ve=e.get(ie);if(ve===void 0)continue;const ee=ve.buffer,te=ve.type,oe=ve.bytesPerElement,me=te===i.INT||te===i.UNSIGNED_INT||ie.gpuType===br;if(ie.isInterleavedBufferAttribute){const ce=ie.data,S=ce.stride,E=ie.offset;if(ce.isInstancedInterleavedBuffer){for(let R=0;R<K.locationSize;R++)h(K.location+R,ce.meshPerAttribute);F.isInstancedMesh!==!0&&j._maxInstanceCount===void 0&&(j._maxInstanceCount=ce.meshPerAttribute*ce.count)}else for(let R=0;R<K.locationSize;R++)d(K.location+R);i.bindBuffer(i.ARRAY_BUFFER,ee);for(let R=0;R<K.locationSize;R++)_(K.location+R,fe/K.locationSize,te,ne,S*oe,(E+fe/K.locationSize*R)*oe,me)}else{if(ie.isInstancedBufferAttribute){for(let ce=0;ce<K.locationSize;ce++)h(K.location+ce,ie.meshPerAttribute);F.isInstancedMesh!==!0&&j._maxInstanceCount===void 0&&(j._maxInstanceCount=ie.meshPerAttribute*ie.count)}else for(let ce=0;ce<K.locationSize;ce++)d(K.location+ce);i.bindBuffer(i.ARRAY_BUFFER,ee);for(let ce=0;ce<K.locationSize;ce++)_(K.location+ce,fe/K.locationSize,te,ne,fe*oe,fe/K.locationSize*ce*oe,me)}}else if(H!==void 0){const ne=H[$];if(ne!==void 0)switch(ne.length){case 2:i.vertexAttrib2fv(K.location,ne);break;case 3:i.vertexAttrib3fv(K.location,ne);break;case 4:i.vertexAttrib4fv(K.location,ne);break;default:i.vertexAttrib1fv(K.location,ne)}}}}p()})(m,g,v,T),O!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(O).buffer))},reset:x,resetDefaultState:f,dispose:function(){x();for(const m in n){const g=n[m];for(const v in g){const T=g[v];for(const O in T)o(T[O].object),delete T[O];delete g[v]}delete n[m]}},releaseStatesOfGeometry:function(m){if(n[m.id]===void 0)return;const g=n[m.id];for(const v in g){const T=g[v];for(const O in T)o(T[O].object),delete T[O];delete g[v]}delete n[m.id]},releaseStatesOfProgram:function(m){for(const g in n){const v=n[g];if(v[m.id]===void 0)continue;const T=v[m.id];for(const O in T)o(T[O].object),delete T[O];delete v[m.id]}},initAttributes:u,enableAttribute:d,disableUnusedAttributes:p}}function Nl(i,e,t){let n;function r(a,s,l){l!==0&&(i.drawArraysInstanced(n,a,s,l),t.update(s,n,l))}this.setMode=function(a){n=a},this.render=function(a,s){i.drawArrays(n,a,s),t.update(s,n,1)},this.renderInstances=r,this.renderMultiDraw=function(a,s,l){if(l===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,a,0,s,0,l);let o=0;for(let c=0;c<l;c++)o+=s[c];t.update(o,n,1)},this.renderMultiDrawInstances=function(a,s,l,o){if(l===0)return;const c=e.get("WEBGL_multi_draw");if(c===null)for(let u=0;u<a.length;u++)r(a[u],s[u],o[u]);else{c.multiDrawArraysInstancedWEBGL(n,a,0,s,0,o,0,l);let u=0;for(let d=0;d<l;d++)u+=s[d]*o[d];t.update(u,n,1)}}}function Ol(i,e,t,n){let r;function a(h){if(h==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";h="mediump"}return h==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let s=t.precision!==void 0?t.precision:"highp";const l=a(s);l!==s&&(console.warn("THREE.WebGLRenderer:",s,"not supported, using",l,"instead."),s=l);const o=t.logarithmicDepthBuffer===!0,c=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),u=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),d=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS);return{isWebGL2:!0,getMaxAnisotropy:function(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const h=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(h.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r},getMaxPrecision:a,textureFormatReadable:function(h){return h===Lt||n.convert(h)===i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT)},textureTypeReadable:function(h){const p=h===ii&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(h!==qt&&n.convert(h)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&h!==Ot&&!p)},precision:s,logarithmicDepthBuffer:o,reverseDepthBuffer:c,maxTextures:u,maxVertexTextures:d,maxTextureSize:i.getParameter(i.MAX_TEXTURE_SIZE),maxCubemapSize:i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),maxAttributes:i.getParameter(i.MAX_VERTEX_ATTRIBS),maxVertexUniforms:i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),maxVaryings:i.getParameter(i.MAX_VARYING_VECTORS),maxFragmentUniforms:i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),vertexTextures:d>0,maxSamples:i.getParameter(i.MAX_SAMPLES)}}function Fl(i){const e=this;let t=null,n=0,r=!1,a=!1;const s=new _n,l=new ye,o={value:null,needsUpdate:!1};function c(u,d,h,p){const _=u!==null?u.length:0;let x=null;if(_!==0){if(x=o.value,p!==!0||x===null){const f=h+4*_,m=d.matrixWorldInverse;l.getNormalMatrix(m),(x===null||x.length<f)&&(x=new Float32Array(f));for(let g=0,v=h;g!==_;++g,v+=4)s.copy(u[g]).applyMatrix4(m,l),s.normal.toArray(x,v),x[v+3]=s.constant}o.value=x,o.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,x}this.uniform=o,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const h=u.length!==0||d||n!==0||r;return r=d,n=u.length,h},this.beginShadows=function(){a=!0,c(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(u,d){t=c(u,d,0)},this.setState=function(u,d,h){const p=u.clippingPlanes,_=u.clipIntersection,x=u.clipShadows,f=i.get(u);if(!r||p===null||p.length===0||a&&!x)a?c(null):(function(){o.value!==t&&(o.value=t,o.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0})();else{const m=a?0:n,g=4*m;let v=f.clippingState||null;o.value=v,v=c(p,d,g,h);for(let T=0;T!==g;++T)v[T]=t[T];f.clippingState=v,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=m}}}function Bl(i){let e=new WeakMap;function t(r,a){return a===Mr?r.mapping=An:a===Sr&&(r.mapping=Rn),r}function n(r){const a=r.target;a.removeEventListener("dispose",n);const s=e.get(a);s!==void 0&&(e.delete(a),s.dispose())}return{get:function(r){if(r&&r.isTexture){const a=r.mapping;if(a===Mr||a===Sr){if(e.has(r))return t(e.get(r).texture,r.mapping);{const s=r.image;if(s&&s.height>0){const l=new Rl(s.height);return l.fromEquirectangularTexture(i,r),e.set(r,l),r.addEventListener("dispose",n),t(l.texture,r.mapping)}return null}}}return r},dispose:function(){e=new WeakMap}}}class zl extends ya{constructor(e=-1,t=1,n=1,r=-1,a=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=a,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,a,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let a=n-e,s=n+e,l=r+t,o=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,s=a+c*this.view.width,l-=u*this.view.offsetY,o=l-u*this.view.height}this.projectionMatrix.makeOrthographic(a,s,l,o,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Os=[.125,.215,.35,.446,.526,.582],mi=20,wa=new zl,Fs=new Fe;let Aa=null,Ra=0,Ca=0,Pa=!1;const Mn=(1+Math.sqrt(5))/2,Zn=1/Mn,Bs=[new b(-Mn,Zn,0),new b(Mn,Zn,0),new b(-Zn,0,Mn),new b(Zn,0,Mn),new b(0,Mn,-Zn),new b(0,Mn,Zn),new b(-1,1,-1),new b(1,1,-1),new b(-1,1,1),new b(1,1,1)];class zs{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,r=100){Aa=this._renderer.getRenderTarget(),Ra=this._renderer.getActiveCubeFace(),Ca=this._renderer.getActiveMipmapLevel(),Pa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const a=this._allocateTargets();return a.depthBuffer=!0,this._sceneToCubeUV(e,n,r,a),t>0&&this._blur(a,0,0,t),this._applyPMREM(a),this._cleanup(a),a}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Vs(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Gs(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Aa,Ra,Ca),this._renderer.xr.enabled=Pa,e.scissorTest=!1,rr(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===An||e.mapping===Rn?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Aa=this._renderer.getRenderTarget(),Ra=this._renderer.getActiveCubeFace(),Ca=this._renderer.getActiveMipmapLevel(),Pa=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Pt,minFilter:Pt,generateMipmaps:!1,type:ii,format:Lt,colorSpace:Ln,depthBuffer:!1},r=Hs(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Hs(e,t,n);const{_lodMax:a}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=(function(s){const l=[],o=[],c=[];let u=s;const d=s-4+1+Os.length;for(let h=0;h<d;h++){const p=Math.pow(2,u);o.push(p);let _=1/p;h>s-4?_=Os[h-s+4-1]:h===0&&(_=0),c.push(_);const x=1/(p-2),f=-x,m=1+x,g=[f,f,m,f,m,m,f,f,m,m,f,m],v=6,T=6,O=3,C=2,B=1,F=new Float32Array(O*T*v),D=new Float32Array(C*T*v),W=new Float32Array(B*T*v);for(let G=0;G<v;G++){const Y=G%3*2/3-1,H=G>2?0:-1,$=[Y,H,0,Y+2/3,H,0,Y+2/3,H+1,0,Y,H,0,Y+2/3,H+1,0,Y,H+1,0];F.set($,O*T*G),D.set(g,C*T*G);const K=[G,G,G,G,G,G];W.set(K,B*T*G)}const j=new en;j.setAttribute("position",new bt(F,O)),j.setAttribute("uv",new bt(D,C)),j.setAttribute("faceIndex",new bt(W,B)),l.push(j),u>4&&u--}return{lodPlanes:l,sizeLods:o,sigmas:c}})(a)),this._blurMaterial=(function(s,l,o){const c=new Float32Array(mi),u=new b(0,1,0);return new Xt({name:"SphericalGaussianBlur",defines:{n:mi,CUBEUV_TEXEL_WIDTH:1/l,CUBEUV_TEXEL_HEIGHT:1/o,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:c},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:u}},vertexShader:La(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})})(a,e,t)}return r}_compileMaterial(e){const t=new _t(this._lodPlanes[0],e);this._renderer.compile(t,wa)}_sceneToCubeUV(e,t,n,r){const a=new vt(90,1,t,n),s=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],o=this._renderer,c=o.autoClear,u=o.toneMapping;o.getClearColor(Fs),o.toneMapping=0,o.autoClear=!1;const d=new bs({name:"PMREM.Background",side:1,depthWrite:!1,depthTest:!1}),h=new _t(new fi,d);let p=!1;const _=e.background;_?_.isColor&&(d.color.copy(_),e.background=null,p=!0):(d.color.copy(Fs),p=!0);for(let x=0;x<6;x++){const f=x%3;f===0?(a.up.set(0,s[x],0),a.lookAt(l[x],0,0)):f===1?(a.up.set(0,0,s[x]),a.lookAt(0,l[x],0)):(a.up.set(0,s[x],0),a.lookAt(0,0,l[x]));const m=this._cubeSize;rr(r,f*m,x>2?m:0,m,m),o.setRenderTarget(r),p&&o.render(h,a),o.render(e,a)}h.geometry.dispose(),h.material.dispose(),o.toneMapping=u,o.autoClear=c,e.background=_}_textureToCubeUV(e,t){const n=this._renderer,r=e.mapping===An||e.mapping===Rn;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Vs()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Gs());const a=r?this._cubemapMaterial:this._equirectMaterial,s=new _t(this._lodPlanes[0],a);a.uniforms.envMap.value=e;const l=this._cubeSize;rr(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(s,wa)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const r=this._lodPlanes.length;for(let a=1;a<r;a++){const s=Math.sqrt(this._sigmas[a]*this._sigmas[a]-this._sigmas[a-1]*this._sigmas[a-1]),l=Bs[(r-a-1)%Bs.length];this._blur(e,a-1,a,s,l)}t.autoClear=n}_blur(e,t,n,r,a){const s=this._pingPongRenderTarget;this._halfBlur(e,s,t,n,r,"latitudinal",a),this._halfBlur(s,e,n,n,r,"longitudinal",a)}_halfBlur(e,t,n,r,a,s,l){const o=this._renderer,c=this._blurMaterial;s!=="latitudinal"&&s!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=new _t(this._lodPlanes[r],c),d=c.uniforms,h=this._sizeLods[n]-1,p=isFinite(a)?Math.PI/(2*h):2*Math.PI/39,_=a/p,x=isFinite(a)?1+Math.floor(3*_):mi;x>mi&&console.warn(`sigmaRadians, ${a}, is too large and will clip, as it requested ${x} samples when the maximum is set to 20`);const f=[];let m=0;for(let T=0;T<mi;++T){const O=T/_,C=Math.exp(-O*O/2);f.push(C),T===0?m+=C:T<x&&(m+=2*C)}for(let T=0;T<f.length;T++)f[T]=f[T]/m;d.envMap.value=e.texture,d.samples.value=x,d.weights.value=f,d.latitudinal.value=s==="latitudinal",l&&(d.poleAxis.value=l);const{_lodMax:g}=this;d.dTheta.value=p,d.mipInt.value=g-n;const v=this._sizeLods[r];rr(t,3*v*(r>g-4?r-g+4:0),4*(this._cubeSize-v),3*v,2*v),o.setRenderTarget(t),o.render(u,wa)}}function Hs(i,e,t){const n=new dn(i,e,t);return n.texture.mapping=Ri,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function rr(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r)}function Gs(){return new Xt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:La(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Vs(){return new Xt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:La(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function La(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Hl(i){let e=new WeakMap,t=null;function n(r){const a=r.target;a.removeEventListener("dispose",n);const s=e.get(a);s!==void 0&&(e.delete(a),s.dispose())}return{get:function(r){if(r&&r.isTexture){const a=r.mapping,s=a===Mr||a===Sr,l=a===An||a===Rn;if(s||l){let o=e.get(r);const c=o!==void 0?o.texture.pmremVersion:0;if(r.isRenderTargetTexture&&r.pmremVersion!==c)return t===null&&(t=new zs(i)),o=s?t.fromEquirectangular(r,o):t.fromCubemap(r,o),o.texture.pmremVersion=r.pmremVersion,e.set(r,o),o.texture;if(o!==void 0)return o.texture;{const u=r.image;return s&&u&&u.height>0||l&&u&&(function(d){let h=0;const p=6;for(let _=0;_<p;_++)d[_]!==void 0&&h++;return h===p})(u)?(t===null&&(t=new zs(i)),o=s?t.fromEquirectangular(r):t.fromCubemap(r),o.texture.pmremVersion=r.pmremVersion,e.set(r,o),r.addEventListener("dispose",n),o.texture):null}}}return r},dispose:function(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}}}function Gl(i){const e={};function t(n){if(e[n]!==void 0)return e[n];let r;switch(n){case"WEBGL_depth_texture":r=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=i.getExtension(n)}return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const r=t(n);return r===null&&li("THREE.WebGLRenderer: "+n+" extension not supported."),r}}}function Vl(i,e,t,n){const r={},a=new WeakMap;function s(o){const c=o.target;c.index!==null&&e.remove(c.index);for(const d in c.attributes)e.remove(c.attributes[d]);for(const d in c.morphAttributes){const h=c.morphAttributes[d];for(let p=0,_=h.length;p<_;p++)e.remove(h[p])}c.removeEventListener("dispose",s),delete r[c.id];const u=a.get(c);u&&(e.remove(u),a.delete(c)),n.releaseStatesOfGeometry(c),c.isInstancedBufferGeometry===!0&&delete c._maxInstanceCount,t.memory.geometries--}function l(o){const c=[],u=o.index,d=o.attributes.position;let h=0;if(u!==null){const x=u.array;h=u.version;for(let f=0,m=x.length;f<m;f+=3){const g=x[f+0],v=x[f+1],T=x[f+2];c.push(g,v,v,T,T,g)}}else{if(d===void 0)return;{const x=d.array;h=d.version;for(let f=0,m=x.length/3-1;f<m;f+=3){const g=f+0,v=f+1,T=f+2;c.push(g,v,v,T,T,g)}}}const p=new(as(c)?As:ws)(c,1);p.version=h;const _=a.get(o);_&&e.remove(_),a.set(o,p)}return{get:function(o,c){return r[c.id]===!0||(c.addEventListener("dispose",s),r[c.id]=!0,t.memory.geometries++),c},update:function(o){const c=o.attributes;for(const d in c)e.update(c[d],i.ARRAY_BUFFER);const u=o.morphAttributes;for(const d in u){const h=u[d];for(let p=0,_=h.length;p<_;p++)e.update(h[p],i.ARRAY_BUFFER)}},getWireframeAttribute:function(o){const c=a.get(o);if(c){const u=o.index;u!==null&&c.version<u.version&&l(o)}else l(o);return a.get(o)}}}function kl(i,e,t){let n,r,a;function s(l,o,c){c!==0&&(i.drawElementsInstanced(n,o,r,l*a,c),t.update(o,n,c))}this.setMode=function(l){n=l},this.setIndex=function(l){r=l.type,a=l.bytesPerElement},this.render=function(l,o){i.drawElements(n,o,r,l*a),t.update(o,n,1)},this.renderInstances=s,this.renderMultiDraw=function(l,o,c){if(c===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,o,0,r,l,0,c);let u=0;for(let d=0;d<c;d++)u+=o[d];t.update(u,n,1)},this.renderMultiDrawInstances=function(l,o,c,u){if(c===0)return;const d=e.get("WEBGL_multi_draw");if(d===null)for(let h=0;h<l.length;h++)s(l[h]/a,o[h],u[h]);else{d.multiDrawElementsInstancedWEBGL(n,o,0,r,l,0,u,0,c);let h=0;for(let p=0;p<c;p++)h+=o[p]*u[p];t.update(h,n,1)}}}function Wl(i){const e={frame:0,calls:0,triangles:0,points:0,lines:0};return{memory:{geometries:0,textures:0},render:e,programs:null,autoReset:!0,reset:function(){e.calls=0,e.triangles=0,e.points=0,e.lines=0},update:function(t,n,r){switch(e.calls++,n){case i.TRIANGLES:e.triangles+=r*(t/3);break;case i.LINES:e.lines+=r*(t/2);break;case i.LINE_STRIP:e.lines+=r*(t-1);break;case i.LINE_LOOP:e.lines+=r*t;break;case i.POINTS:e.points+=r*t;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",n)}}}}function Xl(i,e,t){const n=new WeakMap,r=new qe;return{update:function(a,s,l){const o=a.morphTargetInfluences,c=s.morphAttributes.position||s.morphAttributes.normal||s.morphAttributes.color,u=c!==void 0?c.length:0;let d=n.get(s);if(d===void 0||d.count!==u){let F=function(){C.dispose(),n.delete(s),s.removeEventListener("dispose",F)};d!==void 0&&d.texture.dispose();const h=s.morphAttributes.position!==void 0,p=s.morphAttributes.normal!==void 0,_=s.morphAttributes.color!==void 0,x=s.morphAttributes.position||[],f=s.morphAttributes.normal||[],m=s.morphAttributes.color||[];let g=0;h===!0&&(g=1),p===!0&&(g=2),_===!0&&(g=3);let v=s.attributes.position.count*g,T=1;v>e.maxTextureSize&&(T=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);const O=new Float32Array(v*T*4*u),C=new fs(O,v,T,u);C.type=Ot,C.needsUpdate=!0;const B=4*g;for(let D=0;D<u;D++){const W=x[D],j=f[D],G=m[D],Y=v*T*4*D;for(let H=0;H<W.count;H++){const $=H*B;h===!0&&(r.fromBufferAttribute(W,H),O[Y+$+0]=r.x,O[Y+$+1]=r.y,O[Y+$+2]=r.z,O[Y+$+3]=0),p===!0&&(r.fromBufferAttribute(j,H),O[Y+$+4]=r.x,O[Y+$+5]=r.y,O[Y+$+6]=r.z,O[Y+$+7]=0),_===!0&&(r.fromBufferAttribute(G,H),O[Y+$+8]=r.x,O[Y+$+9]=r.y,O[Y+$+10]=r.z,O[Y+$+11]=G.itemSize===4?r.w:1)}}d={count:u,texture:C,size:new Oe(v,T)},n.set(s,d),s.addEventListener("dispose",F)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let h=0;for(let _=0;_<o.length;_++)h+=o[_];const p=s.morphTargetsRelative?1:1-h;l.getUniforms().setValue(i,"morphTargetBaseInfluence",p),l.getUniforms().setValue(i,"morphTargetInfluences",o)}l.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}}}function ql(i,e,t,n){let r=new WeakMap;function a(s){const l=s.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:function(s){const l=n.render.frame,o=s.geometry,c=e.get(s,o);if(r.get(c)!==l&&(e.update(c),r.set(c,l)),s.isInstancedMesh&&(s.hasEventListener("dispose",a)===!1&&s.addEventListener("dispose",a),r.get(s)!==l&&(t.update(s.instanceMatrix,i.ARRAY_BUFFER),s.instanceColor!==null&&t.update(s.instanceColor,i.ARRAY_BUFFER),r.set(s,l))),s.isSkinnedMesh){const u=s.skeleton;r.get(u)!==l&&(u.update(),r.set(u,l))}return c},dispose:function(){r=new WeakMap}}}class ks extends st{constructor(e,t,n,r,a,s,l,o,c,u=1026){if(u!==ri&&u!==Pn)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===ri&&(n=un),n===void 0&&u===Pn&&(n=Cn),super(null,r,a,s,l,o,u,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=l!==void 0?l:St,this.minFilter=o!==void 0?o:St,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}const Ws=new st,Xs=new ks(1,1),qs=new fs,js=new ml,Ys=new Is,Ks=[],Zs=[],Js=new Float32Array(16),$s=new Float32Array(9),Qs=new Float32Array(4);function Jn(i,e,t){const n=i[0];if(n<=0||n>0)return i;const r=e*t;let a=Ks[r];if(a===void 0&&(a=new Float32Array(r),Ks[r]=a),e!==0){n.toArray(a,0);for(let s=1,l=0;s!==e;++s)l+=t,i[s].toArray(a,l)}return a}function Ze(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Je(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function ar(i,e){let t=Zs[e];t===void 0&&(t=new Int32Array(e),Zs[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function jl(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Yl(i,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ze(t,e))return;i.uniform2fv(this.addr,e),Je(t,e)}}function Kl(i,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)t[0]===e.r&&t[1]===e.g&&t[2]===e.b||(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ze(t,e))return;i.uniform3fv(this.addr,e),Je(t,e)}}function Zl(i,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ze(t,e))return;i.uniform4fv(this.addr,e),Je(t,e)}}function Jl(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Ze(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Je(t,e)}else{if(Ze(t,n))return;Qs.set(n),i.uniformMatrix2fv(this.addr,!1,Qs),Je(t,n)}}function $l(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Ze(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Je(t,e)}else{if(Ze(t,n))return;$s.set(n),i.uniformMatrix3fv(this.addr,!1,$s),Je(t,n)}}function Ql(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Ze(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Je(t,e)}else{if(Ze(t,n))return;Js.set(n),i.uniformMatrix4fv(this.addr,!1,Js),Je(t,n)}}function ec(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function tc(i,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ze(t,e))return;i.uniform2iv(this.addr,e),Je(t,e)}}function nc(i,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ze(t,e))return;i.uniform3iv(this.addr,e),Je(t,e)}}function ic(i,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ze(t,e))return;i.uniform4iv(this.addr,e),Je(t,e)}}function rc(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function ac(i,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ze(t,e))return;i.uniform2uiv(this.addr,e),Je(t,e)}}function sc(i,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ze(t,e))return;i.uniform3uiv(this.addr,e),Je(t,e)}}function oc(i,e){const t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ze(t,e))return;i.uniform4uiv(this.addr,e),Je(t,e)}}function lc(i,e,t){const n=this.cache,r=t.allocateTextureUnit();let a;n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),this.type===i.SAMPLER_2D_SHADOW?(Xs.compareFunction=515,a=Xs):a=Ws,t.setTexture2D(e||a,r)}function cc(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||js,r)}function uc(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||Ys,r)}function hc(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||qs,r)}function dc(i,e){i.uniform1fv(this.addr,e)}function fc(i,e){const t=Jn(e,this.size,2);i.uniform2fv(this.addr,t)}function pc(i,e){const t=Jn(e,this.size,3);i.uniform3fv(this.addr,t)}function mc(i,e){const t=Jn(e,this.size,4);i.uniform4fv(this.addr,t)}function gc(i,e){const t=Jn(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function _c(i,e){const t=Jn(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function vc(i,e){const t=Jn(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function xc(i,e){i.uniform1iv(this.addr,e)}function Mc(i,e){i.uniform2iv(this.addr,e)}function Sc(i,e){i.uniform3iv(this.addr,e)}function Ec(i,e){i.uniform4iv(this.addr,e)}function yc(i,e){i.uniform1uiv(this.addr,e)}function Tc(i,e){i.uniform2uiv(this.addr,e)}function bc(i,e){i.uniform3uiv(this.addr,e)}function wc(i,e){i.uniform4uiv(this.addr,e)}function Ac(i,e,t){const n=this.cache,r=e.length,a=ar(t,r);Ze(n,a)||(i.uniform1iv(this.addr,a),Je(n,a));for(let s=0;s!==r;++s)t.setTexture2D(e[s]||Ws,a[s])}function Rc(i,e,t){const n=this.cache,r=e.length,a=ar(t,r);Ze(n,a)||(i.uniform1iv(this.addr,a),Je(n,a));for(let s=0;s!==r;++s)t.setTexture3D(e[s]||js,a[s])}function Cc(i,e,t){const n=this.cache,r=e.length,a=ar(t,r);Ze(n,a)||(i.uniform1iv(this.addr,a),Je(n,a));for(let s=0;s!==r;++s)t.setTextureCube(e[s]||Ys,a[s])}function Pc(i,e,t){const n=this.cache,r=e.length,a=ar(t,r);Ze(n,a)||(i.uniform1iv(this.addr,a),Je(n,a));for(let s=0;s!==r;++s)t.setTexture2DArray(e[s]||qs,a[s])}class Lc{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=(function(r){switch(r){case 5126:return jl;case 35664:return Yl;case 35665:return Kl;case 35666:return Zl;case 35674:return Jl;case 35675:return $l;case 35676:return Ql;case 5124:case 35670:return ec;case 35667:case 35671:return tc;case 35668:case 35672:return nc;case 35669:case 35673:return ic;case 5125:return rc;case 36294:return ac;case 36295:return sc;case 36296:return oc;case 35678:case 36198:case 36298:case 36306:case 35682:return lc;case 35679:case 36299:case 36307:return cc;case 35680:case 36300:case 36308:case 36293:return uc;case 36289:case 36303:case 36311:case 36292:return hc}})(t.type)}}class Uc{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=(function(r){switch(r){case 5126:return dc;case 35664:return fc;case 35665:return pc;case 35666:return mc;case 35674:return gc;case 35675:return _c;case 35676:return vc;case 5124:case 35670:return xc;case 35667:case 35671:return Mc;case 35668:case 35672:return Sc;case 35669:case 35673:return Ec;case 5125:return yc;case 36294:return Tc;case 36295:return bc;case 36296:return wc;case 35678:case 36198:case 36298:case 36306:case 35682:return Ac;case 35679:case 36299:case 36307:return Rc;case 35680:case 36300:case 36308:case 36293:return Cc;case 36289:case 36303:case 36311:case 36292:return Pc}})(t.type)}}class Dc{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const r=this.seq;for(let a=0,s=r.length;a!==s;++a){const l=r[a];l.setValue(e,t[l.id],n)}}}const Ua=/(\w+)(\])?(\[|\.)?/g;function eo(i,e){i.seq.push(e),i.map[e.id]=e}function Ic(i,e,t){const n=i.name,r=n.length;for(Ua.lastIndex=0;;){const a=Ua.exec(n),s=Ua.lastIndex;let l=a[1];const o=a[2]==="]",c=a[3];if(o&&(l|=0),c===void 0||c==="["&&s+2===r){eo(t,c===void 0?new Lc(l,i,e):new Uc(l,i,e));break}{let u=t.map[l];u===void 0&&(u=new Dc(l),eo(t,u)),t=u}}}class sr{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){const a=e.getActiveUniform(t,r);Ic(a,e.getUniformLocation(t,a.name),this)}}setValue(e,t,n,r){const a=this.map[t];a!==void 0&&a.setValue(e,n,r)}setOptional(e,t,n){const r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let a=0,s=t.length;a!==s;++a){const l=t[a],o=n[l.id];o.needsUpdate!==!1&&l.setValue(e,o.value,r)}}static seqWithValue(e,t){const n=[];for(let r=0,a=e.length;r!==a;++r){const s=e[r];s.id in t&&n.push(s)}return n}}function to(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}let Nc=0;const no=new ye;function io(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),r=i.getShaderInfoLog(e).trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const s=parseInt(a[1]);return t.toUpperCase()+`

`+r+`

`+(function(l,o){const c=l.split(`
`),u=[],d=Math.max(o-6,0),h=Math.min(o+6,c.length);for(let p=d;p<h;p++){const _=p+1;u.push(`${_===o?">":" "} ${_}: ${c[p]}`)}return u.join(`
`)})(i.getShaderSource(e),s)}return r}function Oc(i,e){const t=(function(n){Ne._getMatrix(no,Ne.workingColorSpace,n);const r=`mat3( ${no.elements.map((a=>a.toFixed(4)))} )`;switch(Ne.getTransfer(n)){case Ni:return[r,"LinearTransferOETF"];case Ge:return[r,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",n),[r,"LinearTransferOETF"]}})(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Fc(i,e){let t;switch(e){case 1:t="Linear";break;case 2:t="Reinhard";break;case 3:t="Cineon";break;case 4:t="ACESFilmic";break;case 6:t="AgX";break;case 7:t="Neutral";break;case 5:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const or=new b;function Bc(){return Ne.getLuminanceCoefficients(or),["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${or.x.toFixed(4)}, ${or.y.toFixed(4)}, ${or.z.toFixed(4)} );`,"	return dot( weights, rgb );","}"].join(`
`)}function gi(i){return i!==""}function ro(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function ao(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const zc=/^[ \t]*#include +<([\w\d./]+)>/gm;function Da(i){return i.replace(zc,Gc)}const Hc=new Map;function Gc(i,e){let t=be[e];if(t===void 0){const n=Hc.get(e);if(n===void 0)throw new Error("Can not resolve #include <"+e+">");t=be[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n)}return Da(t)}const Vc=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function so(i){return i.replace(Vc,kc)}function kc(i,e,t,n){let r="";for(let a=parseInt(e);a<parseInt(t);a++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function oo(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function Wc(i,e,t,n){const r=i.getContext(),a=t.defines;let s=t.vertexShader,l=t.fragmentShader;const o=(function(j){let G="SHADOWMAP_TYPE_BASIC";return j.shadowMapType===1?G="SHADOWMAP_TYPE_PCF":j.shadowMapType===2?G="SHADOWMAP_TYPE_PCF_SOFT":j.shadowMapType===3&&(G="SHADOWMAP_TYPE_VSM"),G})(t),c=(function(j){let G="ENVMAP_TYPE_CUBE";if(j.envMap)switch(j.envMapMode){case An:case Rn:G="ENVMAP_TYPE_CUBE";break;case Ri:G="ENVMAP_TYPE_CUBE_UV"}return G})(t),u=(function(j){let G="ENVMAP_MODE_REFLECTION";return j.envMap&&j.envMapMode===Rn&&(G="ENVMAP_MODE_REFRACTION"),G})(t),d=(function(j){let G="ENVMAP_BLENDING_NONE";if(j.envMap)switch(j.combine){case 0:G="ENVMAP_BLENDING_MULTIPLY";break;case 1:G="ENVMAP_BLENDING_MIX";break;case 2:G="ENVMAP_BLENDING_ADD"}return G})(t),h=(function(j){const G=j.envMapCubeUVHeight;if(G===null)return null;const Y=Math.log2(G)-2,H=1/G;return{texelWidth:1/(3*Math.max(Math.pow(2,Y),112)),texelHeight:H,maxMip:Y}})(t),p=(function(j){return[j.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",j.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(gi).join(`
`)})(t),_=(function(j){const G=[];for(const Y in j){const H=j[Y];H!==!1&&G.push("#define "+Y+" "+H)}return G.join(`
`)})(a),x=r.createProgram();let f,m,g=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(gi).join(`
`),f.length>0&&(f+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(gi).join(`
`),m.length>0&&(m+=`
`)):(f=[oo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+o:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(gi).join(`
`),m=[oo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+o:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==0?"#define TONE_MAPPING":"",t.toneMapping!==0?be.tonemapping_pars_fragment:"",t.toneMapping!==0?Fc("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",be.colorspace_pars_fragment,Oc("linearToOutputTexel",t.outputColorSpace),Bc(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(gi).join(`
`)),s=Da(s),s=ro(s,t),s=ao(s,t),l=Da(l),l=ro(l,t),l=ao(l,t),s=so(s),l=so(l),t.isRawShaderMaterial!==!0&&(g=`#version 300 es
`,f=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,m=["#define varying in",t.glslVersion===is?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===is?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const v=g+f+s,T=g+m+l,O=to(r,r.VERTEX_SHADER,v),C=to(r,r.FRAGMENT_SHADER,T);function B(j){if(i.debug.checkShaderErrors){const G=r.getProgramInfoLog(x).trim(),Y=r.getShaderInfoLog(O).trim(),H=r.getShaderInfoLog(C).trim();let $=!0,K=!0;if(r.getProgramParameter(x,r.LINK_STATUS)===!1)if($=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,x,O,C);else{const ie=io(r,O,"vertex"),ne=io(r,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(x,r.VALIDATE_STATUS)+`

Material Name: `+j.name+`
Material Type: `+j.type+`

Program Info Log: `+G+`
`+ie+`
`+ne)}else G!==""?console.warn("THREE.WebGLProgram: Program Info Log:",G):Y!==""&&H!==""||(K=!1);K&&(j.diagnostics={runnable:$,programLog:G,vertexShader:{log:Y,prefix:f},fragmentShader:{log:H,prefix:m}})}r.deleteShader(O),r.deleteShader(C),F=new sr(r,x),D=(function(G,Y){const H={},$=G.getProgramParameter(Y,G.ACTIVE_ATTRIBUTES);for(let K=0;K<$;K++){const ie=G.getActiveAttrib(Y,K),ne=ie.name;let fe=1;ie.type===G.FLOAT_MAT2&&(fe=2),ie.type===G.FLOAT_MAT3&&(fe=3),ie.type===G.FLOAT_MAT4&&(fe=4),H[ne]={type:ie.type,location:G.getAttribLocation(Y,ne),locationSize:fe}}return H})(r,x)}let F,D;r.attachShader(x,O),r.attachShader(x,C),t.index0AttributeName!==void 0?r.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(x,0,"position"),r.linkProgram(x),this.getUniforms=function(){return F===void 0&&B(this),F},this.getAttributes=function(){return D===void 0&&B(this),D};let W=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return W===!1&&(W=r.getProgramParameter(x,37297)),W},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Nc++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=O,this.fragmentShader=C,this}let Xc=0;class qc{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,r=this._getShaderStage(t),a=this._getShaderStage(n),s=this._getShaderCacheForMaterial(e);return s.has(r)===!1&&(s.add(r),r.usedTimes++),s.has(a)===!1&&(s.add(a),a.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new jc(e),t.set(e,n)),n}}class jc{constructor(e){this.id=Xc++,this.code=e,this.usedTimes=0}}function Yc(i,e,t,n,r,a,s){const l=new _s,o=new qc,c=new Set,u=[],d=r.logarithmicDepthBuffer,h=r.vertexTextures;let p=r.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(f){return c.add(f),f===0?"uv":`uv${f}`}return{getParameters:function(f,m,g,v,T){const O=v.fog,C=T.geometry,B=f.isMeshStandardMaterial?v.environment:null,F=(f.isMeshStandardMaterial?t:e).get(f.envMap||B),D=F&&F.mapping===Ri?F.image.height:null,W=_[f.type];f.precision!==null&&(p=r.getMaxPrecision(f.precision),p!==f.precision&&console.warn("THREE.WebGLProgram.getParameters:",f.precision,"not supported, using",p,"instead."));const j=C.morphAttributes.position||C.morphAttributes.normal||C.morphAttributes.color,G=j!==void 0?j.length:0;let Y,H,$,K,ie=0;if(C.morphAttributes.position!==void 0&&(ie=1),C.morphAttributes.normal!==void 0&&(ie=2),C.morphAttributes.color!==void 0&&(ie=3),W){const En=Ut[W];Y=En.vertexShader,H=En.fragmentShader}else Y=f.vertexShader,H=f.fragmentShader,o.update(f),$=o.getVertexShaderID(f),K=o.getFragmentShaderID(f);const ne=i.getRenderTarget(),fe=i.state.buffers.depth.getReversed(),ve=T.isInstancedMesh===!0,ee=T.isBatchedMesh===!0,te=!!f.map,oe=!!f.matcap,me=!!F,ce=!!f.aoMap,S=!!f.lightMap,E=!!f.bumpMap,R=!!f.normalMap,X=!!f.displacementMap,P=!!f.emissiveMap,V=!!f.metalnessMap,y=!!f.roughnessMap,U=f.anisotropy>0,z=f.clearcoat>0,ae=f.dispersion>0,N=f.iridescence>0,Z=f.sheen>0,J=f.transmission>0,Q=U&&!!f.anisotropyMap,ue=z&&!!f.clearcoatMap,he=z&&!!f.clearcoatNormalMap,ge=z&&!!f.clearcoatRoughnessMap,Se=N&&!!f.iridescenceMap,Le=N&&!!f.iridescenceThicknessMap,Pe=Z&&!!f.sheenColorMap,_e=Z&&!!f.sheenRoughnessMap,Ie=!!f.specularMap,ze=!!f.specularColorMap,Ve=!!f.specularIntensityMap,pe=J&&!!f.transmissionMap,Re=J&&!!f.thicknessMap,He=!!f.gradientMap,nn=!!f.alphaMap,rn=f.alphaTest>0,ct=!!f.alphaHash,pt=!!f.extensions;let wt=0;f.toneMapped&&(ne!==null&&ne.isXRRenderTarget!==!0||(wt=i.toneMapping));const L={shaderID:W,shaderType:f.type,shaderName:f.name,vertexShader:Y,fragmentShader:H,defines:f.defines,customVertexShaderID:$,customFragmentShaderID:K,isRawShaderMaterial:f.isRawShaderMaterial===!0,glslVersion:f.glslVersion,precision:p,batching:ee,batchingColor:ee&&T._colorsTexture!==null,instancing:ve,instancingColor:ve&&T.instanceColor!==null,instancingMorph:ve&&T.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:ne===null?i.outputColorSpace:ne.isXRRenderTarget===!0?ne.texture.colorSpace:Ln,alphaToCoverage:!!f.alphaToCoverage,map:te,matcap:oe,envMap:me,envMapMode:me&&F.mapping,envMapCubeUVHeight:D,aoMap:ce,lightMap:S,bumpMap:E,normalMap:R,displacementMap:h&&X,emissiveMap:P,normalMapObjectSpace:R&&f.normalMapType===1,normalMapTangentSpace:R&&f.normalMapType===0,metalnessMap:V,roughnessMap:y,anisotropy:U,anisotropyMap:Q,clearcoat:z,clearcoatMap:ue,clearcoatNormalMap:he,clearcoatRoughnessMap:ge,dispersion:ae,iridescence:N,iridescenceMap:Se,iridescenceThicknessMap:Le,sheen:Z,sheenColorMap:Pe,sheenRoughnessMap:_e,specularMap:Ie,specularColorMap:ze,specularIntensityMap:Ve,transmission:J,transmissionMap:pe,thicknessMap:Re,gradientMap:He,opaque:f.transparent===!1&&f.blending===1&&f.alphaToCoverage===!1,alphaMap:nn,alphaTest:rn,alphaHash:ct,combine:f.combine,mapUv:te&&x(f.map.channel),aoMapUv:ce&&x(f.aoMap.channel),lightMapUv:S&&x(f.lightMap.channel),bumpMapUv:E&&x(f.bumpMap.channel),normalMapUv:R&&x(f.normalMap.channel),displacementMapUv:X&&x(f.displacementMap.channel),emissiveMapUv:P&&x(f.emissiveMap.channel),metalnessMapUv:V&&x(f.metalnessMap.channel),roughnessMapUv:y&&x(f.roughnessMap.channel),anisotropyMapUv:Q&&x(f.anisotropyMap.channel),clearcoatMapUv:ue&&x(f.clearcoatMap.channel),clearcoatNormalMapUv:he&&x(f.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ge&&x(f.clearcoatRoughnessMap.channel),iridescenceMapUv:Se&&x(f.iridescenceMap.channel),iridescenceThicknessMapUv:Le&&x(f.iridescenceThicknessMap.channel),sheenColorMapUv:Pe&&x(f.sheenColorMap.channel),sheenRoughnessMapUv:_e&&x(f.sheenRoughnessMap.channel),specularMapUv:Ie&&x(f.specularMap.channel),specularColorMapUv:ze&&x(f.specularColorMap.channel),specularIntensityMapUv:Ve&&x(f.specularIntensityMap.channel),transmissionMapUv:pe&&x(f.transmissionMap.channel),thicknessMapUv:Re&&x(f.thicknessMap.channel),alphaMapUv:nn&&x(f.alphaMap.channel),vertexTangents:!!C.attributes.tangent&&(R||U),vertexColors:f.vertexColors,vertexAlphas:f.vertexColors===!0&&!!C.attributes.color&&C.attributes.color.itemSize===4,pointsUvs:T.isPoints===!0&&!!C.attributes.uv&&(te||nn),fog:!!O,useFog:f.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:f.flatShading===!0,sizeAttenuation:f.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:fe,skinning:T.isSkinnedMesh===!0,morphTargets:C.morphAttributes.position!==void 0,morphNormals:C.morphAttributes.normal!==void 0,morphColors:C.morphAttributes.color!==void 0,morphTargetsCount:G,morphTextureStride:ie,numDirLights:m.directional.length,numPointLights:m.point.length,numSpotLights:m.spot.length,numSpotLightMaps:m.spotLightMap.length,numRectAreaLights:m.rectArea.length,numHemiLights:m.hemi.length,numDirLightShadows:m.directionalShadowMap.length,numPointLightShadows:m.pointShadowMap.length,numSpotLightShadows:m.spotShadowMap.length,numSpotLightShadowsWithMaps:m.numSpotLightShadowsWithMaps,numLightProbes:m.numLightProbes,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:f.dithering,shadowMapEnabled:i.shadowMap.enabled&&g.length>0,shadowMapType:i.shadowMap.type,toneMapping:wt,decodeVideoTexture:te&&f.map.isVideoTexture===!0&&Ne.getTransfer(f.map.colorSpace)===Ge,decodeVideoTextureEmissive:P&&f.emissiveMap.isVideoTexture===!0&&Ne.getTransfer(f.emissiveMap.colorSpace)===Ge,premultipliedAlpha:f.premultipliedAlpha,doubleSided:f.side===2,flipSided:f.side===1,useDepthPacking:f.depthPacking>=0,depthPacking:f.depthPacking||0,index0AttributeName:f.index0AttributeName,extensionClipCullDistance:pt&&f.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(pt&&f.extensions.multiDraw===!0||ee)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:f.customProgramCacheKey()};return L.vertexUv1s=c.has(1),L.vertexUv2s=c.has(2),L.vertexUv3s=c.has(3),c.clear(),L},getProgramCacheKey:function(f){const m=[];if(f.shaderID?m.push(f.shaderID):(m.push(f.customVertexShaderID),m.push(f.customFragmentShaderID)),f.defines!==void 0)for(const g in f.defines)m.push(g),m.push(f.defines[g]);return f.isRawShaderMaterial===!1&&((function(g,v){g.push(v.precision),g.push(v.outputColorSpace),g.push(v.envMapMode),g.push(v.envMapCubeUVHeight),g.push(v.mapUv),g.push(v.alphaMapUv),g.push(v.lightMapUv),g.push(v.aoMapUv),g.push(v.bumpMapUv),g.push(v.normalMapUv),g.push(v.displacementMapUv),g.push(v.emissiveMapUv),g.push(v.metalnessMapUv),g.push(v.roughnessMapUv),g.push(v.anisotropyMapUv),g.push(v.clearcoatMapUv),g.push(v.clearcoatNormalMapUv),g.push(v.clearcoatRoughnessMapUv),g.push(v.iridescenceMapUv),g.push(v.iridescenceThicknessMapUv),g.push(v.sheenColorMapUv),g.push(v.sheenRoughnessMapUv),g.push(v.specularMapUv),g.push(v.specularColorMapUv),g.push(v.specularIntensityMapUv),g.push(v.transmissionMapUv),g.push(v.thicknessMapUv),g.push(v.combine),g.push(v.fogExp2),g.push(v.sizeAttenuation),g.push(v.morphTargetsCount),g.push(v.morphAttributeCount),g.push(v.numDirLights),g.push(v.numPointLights),g.push(v.numSpotLights),g.push(v.numSpotLightMaps),g.push(v.numHemiLights),g.push(v.numRectAreaLights),g.push(v.numDirLightShadows),g.push(v.numPointLightShadows),g.push(v.numSpotLightShadows),g.push(v.numSpotLightShadowsWithMaps),g.push(v.numLightProbes),g.push(v.shadowMapType),g.push(v.toneMapping),g.push(v.numClippingPlanes),g.push(v.numClipIntersection),g.push(v.depthPacking)})(m,f),(function(g,v){l.disableAll(),v.supportsVertexTextures&&l.enable(0),v.instancing&&l.enable(1),v.instancingColor&&l.enable(2),v.instancingMorph&&l.enable(3),v.matcap&&l.enable(4),v.envMap&&l.enable(5),v.normalMapObjectSpace&&l.enable(6),v.normalMapTangentSpace&&l.enable(7),v.clearcoat&&l.enable(8),v.iridescence&&l.enable(9),v.alphaTest&&l.enable(10),v.vertexColors&&l.enable(11),v.vertexAlphas&&l.enable(12),v.vertexUv1s&&l.enable(13),v.vertexUv2s&&l.enable(14),v.vertexUv3s&&l.enable(15),v.vertexTangents&&l.enable(16),v.anisotropy&&l.enable(17),v.alphaHash&&l.enable(18),v.batching&&l.enable(19),v.dispersion&&l.enable(20),v.batchingColor&&l.enable(21),g.push(l.mask),l.disableAll(),v.fog&&l.enable(0),v.useFog&&l.enable(1),v.flatShading&&l.enable(2),v.logarithmicDepthBuffer&&l.enable(3),v.reverseDepthBuffer&&l.enable(4),v.skinning&&l.enable(5),v.morphTargets&&l.enable(6),v.morphNormals&&l.enable(7),v.morphColors&&l.enable(8),v.premultipliedAlpha&&l.enable(9),v.shadowMapEnabled&&l.enable(10),v.doubleSided&&l.enable(11),v.flipSided&&l.enable(12),v.useDepthPacking&&l.enable(13),v.dithering&&l.enable(14),v.transmission&&l.enable(15),v.sheen&&l.enable(16),v.opaque&&l.enable(17),v.pointsUvs&&l.enable(18),v.decodeVideoTexture&&l.enable(19),v.decodeVideoTextureEmissive&&l.enable(20),v.alphaToCoverage&&l.enable(21),g.push(l.mask)})(m,f),m.push(i.outputColorSpace)),m.push(f.customProgramCacheKey),m.join()},getUniforms:function(f){const m=_[f.type];let g;if(m){const v=Ut[m];g=wl.clone(v.uniforms)}else g=f.uniforms;return g},acquireProgram:function(f,m){let g;for(let v=0,T=u.length;v<T;v++){const O=u[v];if(O.cacheKey===m){g=O,++g.usedTimes;break}}return g===void 0&&(g=new Wc(i,m,f,a),u.push(g)),g},releaseProgram:function(f){if(--f.usedTimes==0){const m=u.indexOf(f);u[m]=u[u.length-1],u.pop(),f.destroy()}},releaseShaderCache:function(f){o.remove(f)},programs:u,dispose:function(){o.dispose()}}}function Kc(){let i=new WeakMap;return{has:function(e){return i.has(e)},get:function(e){let t=i.get(e);return t===void 0&&(t={},i.set(e,t)),t},remove:function(e){i.delete(e)},update:function(e,t,n){i.get(e)[t]=n},dispose:function(){i=new WeakMap}}}function Zc(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function lo(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function co(){const i=[];let e=0;const t=[],n=[],r=[];function a(s,l,o,c,u,d){let h=i[e];return h===void 0?(h={id:s.id,object:s,geometry:l,material:o,groupOrder:c,renderOrder:s.renderOrder,z:u,group:d},i[e]=h):(h.id=s.id,h.object=s,h.geometry=l,h.material=o,h.groupOrder=c,h.renderOrder=s.renderOrder,h.z=u,h.group=d),e++,h}return{opaque:t,transmissive:n,transparent:r,init:function(){e=0,t.length=0,n.length=0,r.length=0},push:function(s,l,o,c,u,d){const h=a(s,l,o,c,u,d);o.transmission>0?n.push(h):o.transparent===!0?r.push(h):t.push(h)},unshift:function(s,l,o,c,u,d){const h=a(s,l,o,c,u,d);o.transmission>0?n.unshift(h):o.transparent===!0?r.unshift(h):t.unshift(h)},finish:function(){for(let s=e,l=i.length;s<l;s++){const o=i[s];if(o.id===null)break;o.id=null,o.object=null,o.geometry=null,o.material=null,o.group=null}},sort:function(s,l){t.length>1&&t.sort(s||Zc),n.length>1&&n.sort(l||lo),r.length>1&&r.sort(l||lo)}}}function Jc(){let i=new WeakMap;return{get:function(e,t){const n=i.get(e);let r;return n===void 0?(r=new co,i.set(e,[r])):t>=n.length?(r=new co,n.push(r)):r=n[t],r},dispose:function(){i=new WeakMap}}}function $c(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new b,color:new Fe};break;case"SpotLight":t={position:new b,direction:new b,color:new Fe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new b,color:new Fe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new b,skyColor:new Fe,groundColor:new Fe};break;case"RectAreaLight":t={color:new Fe,position:new b,halfWidth:new b,halfHeight:new b}}return i[e.id]=t,t}}}let Qc=0;function eu(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function tu(i){const e=new $c,t=(function(){const l={};return{get:function(o){if(l[o.id]!==void 0)return l[o.id];let c;switch(o.type){case"DirectionalLight":case"SpotLight":c={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe};break;case"PointLight":c={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Oe,shadowCameraNear:1,shadowCameraFar:1e3}}return l[o.id]=c,c}}})(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new b);const r=new b,a=new Ae,s=new Ae;return{setup:function(l){let o=0,c=0,u=0;for(let B=0;B<9;B++)n.probe[B].set(0,0,0);let d=0,h=0,p=0,_=0,x=0,f=0,m=0,g=0,v=0,T=0,O=0;l.sort(eu);for(let B=0,F=l.length;B<F;B++){const D=l[B],W=D.color,j=D.intensity,G=D.distance,Y=D.shadow&&D.shadow.map?D.shadow.map.texture:null;if(D.isAmbientLight)o+=W.r*j,c+=W.g*j,u+=W.b*j;else if(D.isLightProbe){for(let H=0;H<9;H++)n.probe[H].addScaledVector(D.sh.coefficients[H],j);O++}else if(D.isDirectionalLight){const H=e.get(D);if(H.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){const $=D.shadow,K=t.get(D);K.shadowIntensity=$.intensity,K.shadowBias=$.bias,K.shadowNormalBias=$.normalBias,K.shadowRadius=$.radius,K.shadowMapSize=$.mapSize,n.directionalShadow[d]=K,n.directionalShadowMap[d]=Y,n.directionalShadowMatrix[d]=D.shadow.matrix,f++}n.directional[d]=H,d++}else if(D.isSpotLight){const H=e.get(D);H.position.setFromMatrixPosition(D.matrixWorld),H.color.copy(W).multiplyScalar(j),H.distance=G,H.coneCos=Math.cos(D.angle),H.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),H.decay=D.decay,n.spot[p]=H;const $=D.shadow;if(D.map&&(n.spotLightMap[v]=D.map,v++,$.updateMatrices(D),D.castShadow&&T++),n.spotLightMatrix[p]=$.matrix,D.castShadow){const K=t.get(D);K.shadowIntensity=$.intensity,K.shadowBias=$.bias,K.shadowNormalBias=$.normalBias,K.shadowRadius=$.radius,K.shadowMapSize=$.mapSize,n.spotShadow[p]=K,n.spotShadowMap[p]=Y,g++}p++}else if(D.isRectAreaLight){const H=e.get(D);H.color.copy(W).multiplyScalar(j),H.halfWidth.set(.5*D.width,0,0),H.halfHeight.set(0,.5*D.height,0),n.rectArea[_]=H,_++}else if(D.isPointLight){const H=e.get(D);if(H.color.copy(D.color).multiplyScalar(D.intensity),H.distance=D.distance,H.decay=D.decay,D.castShadow){const $=D.shadow,K=t.get(D);K.shadowIntensity=$.intensity,K.shadowBias=$.bias,K.shadowNormalBias=$.normalBias,K.shadowRadius=$.radius,K.shadowMapSize=$.mapSize,K.shadowCameraNear=$.camera.near,K.shadowCameraFar=$.camera.far,n.pointShadow[h]=K,n.pointShadowMap[h]=Y,n.pointShadowMatrix[h]=D.shadow.matrix,m++}n.point[h]=H,h++}else if(D.isHemisphereLight){const H=e.get(D);H.skyColor.copy(D.color).multiplyScalar(j),H.groundColor.copy(D.groundColor).multiplyScalar(j),n.hemi[x]=H,x++}}_>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=se.LTC_FLOAT_1,n.rectAreaLTC2=se.LTC_FLOAT_2):(n.rectAreaLTC1=se.LTC_HALF_1,n.rectAreaLTC2=se.LTC_HALF_2)),n.ambient[0]=o,n.ambient[1]=c,n.ambient[2]=u;const C=n.hash;C.directionalLength===d&&C.pointLength===h&&C.spotLength===p&&C.rectAreaLength===_&&C.hemiLength===x&&C.numDirectionalShadows===f&&C.numPointShadows===m&&C.numSpotShadows===g&&C.numSpotMaps===v&&C.numLightProbes===O||(n.directional.length=d,n.spot.length=p,n.rectArea.length=_,n.point.length=h,n.hemi.length=x,n.directionalShadow.length=f,n.directionalShadowMap.length=f,n.pointShadow.length=m,n.pointShadowMap.length=m,n.spotShadow.length=g,n.spotShadowMap.length=g,n.directionalShadowMatrix.length=f,n.pointShadowMatrix.length=m,n.spotLightMatrix.length=g+v-T,n.spotLightMap.length=v,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=O,C.directionalLength=d,C.pointLength=h,C.spotLength=p,C.rectAreaLength=_,C.hemiLength=x,C.numDirectionalShadows=f,C.numPointShadows=m,C.numSpotShadows=g,C.numSpotMaps=v,C.numLightProbes=O,n.version=Qc++)},setupView:function(l,o){let c=0,u=0,d=0,h=0,p=0;const _=o.matrixWorldInverse;for(let x=0,f=l.length;x<f;x++){const m=l[x];if(m.isDirectionalLight){const g=n.directional[c];g.direction.setFromMatrixPosition(m.matrixWorld),r.setFromMatrixPosition(m.target.matrixWorld),g.direction.sub(r),g.direction.transformDirection(_),c++}else if(m.isSpotLight){const g=n.spot[d];g.position.setFromMatrixPosition(m.matrixWorld),g.position.applyMatrix4(_),g.direction.setFromMatrixPosition(m.matrixWorld),r.setFromMatrixPosition(m.target.matrixWorld),g.direction.sub(r),g.direction.transformDirection(_),d++}else if(m.isRectAreaLight){const g=n.rectArea[h];g.position.setFromMatrixPosition(m.matrixWorld),g.position.applyMatrix4(_),s.identity(),a.copy(m.matrixWorld),a.premultiply(_),s.extractRotation(a),g.halfWidth.set(.5*m.width,0,0),g.halfHeight.set(0,.5*m.height,0),g.halfWidth.applyMatrix4(s),g.halfHeight.applyMatrix4(s),h++}else if(m.isPointLight){const g=n.point[u];g.position.setFromMatrixPosition(m.matrixWorld),g.position.applyMatrix4(_),u++}else if(m.isHemisphereLight){const g=n.hemi[p];g.direction.setFromMatrixPosition(m.matrixWorld),g.direction.transformDirection(_),p++}}},state:n}}function uo(i){const e=new tu(i),t=[],n=[],r={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:function(a){r.camera=a,t.length=0,n.length=0},state:r,setupLights:function(){e.setup(t)},setupLightsView:function(a){e.setupView(t,a)},pushLight:function(a){t.push(a)},pushShadow:function(a){n.push(a)}}}function nu(i){let e=new WeakMap;return{get:function(t,n=0){const r=e.get(t);let a;return r===void 0?(a=new uo(i),e.set(t,[a])):n>=r.length?(a=new uo(i),r.push(a)):a=r[n],a},dispose:function(){e=new WeakMap}}}class iu extends ji{static get type(){return"MeshDepthMaterial"}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class ru extends ji{static get type(){return"MeshDistanceMaterial"}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}function au(i,e,t){let n=new ba;const r=new Oe,a=new Oe,s=new qe,l=new iu({depthPacking:3201}),o=new ru,c={},u=t.maxTextureSize,d={[Co]:1,[Po]:0,[Wa]:2},h=new Xt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Oe},radius:{value:4}},vertexShader:`void main() {
	gl_Position = vec4( position, 1.0 );
}`,fragmentShader:`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`}),p=h.clone();p.defines.HORIZONTAL_PASS=1;const _=new en;_.setAttribute("position",new bt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new _t(_,h),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let m=this.type;function g(C,B){const F=e.update(x);h.defines.VSM_SAMPLES!==C.blurSamples&&(h.defines.VSM_SAMPLES=C.blurSamples,p.defines.VSM_SAMPLES=C.blurSamples,h.needsUpdate=!0,p.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new dn(r.x,r.y)),h.uniforms.shadow_pass.value=C.map.texture,h.uniforms.resolution.value=C.mapSize,h.uniforms.radius.value=C.radius,i.setRenderTarget(C.mapPass),i.clear(),i.renderBufferDirect(B,null,F,h,x,null),p.uniforms.shadow_pass.value=C.mapPass.texture,p.uniforms.resolution.value=C.mapSize,p.uniforms.radius.value=C.radius,i.setRenderTarget(C.map),i.clear(),i.renderBufferDirect(B,null,F,p,x,null)}function v(C,B,F,D){let W=null;const j=F.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(j!==void 0)W=j;else if(W=F.isPointLight===!0?o:l,i.localClippingEnabled&&B.clipShadows===!0&&Array.isArray(B.clippingPlanes)&&B.clippingPlanes.length!==0||B.displacementMap&&B.displacementScale!==0||B.alphaMap&&B.alphaTest>0||B.map&&B.alphaTest>0){const G=W.uuid,Y=B.uuid;let H=c[G];H===void 0&&(H={},c[G]=H);let $=H[Y];$===void 0&&($=W.clone(),H[Y]=$,B.addEventListener("dispose",O)),W=$}return W.visible=B.visible,W.wireframe=B.wireframe,W.side=D===3?B.shadowSide!==null?B.shadowSide:B.side:B.shadowSide!==null?B.shadowSide:d[B.side],W.alphaMap=B.alphaMap,W.alphaTest=B.alphaTest,W.map=B.map,W.clipShadows=B.clipShadows,W.clippingPlanes=B.clippingPlanes,W.clipIntersection=B.clipIntersection,W.displacementMap=B.displacementMap,W.displacementScale=B.displacementScale,W.displacementBias=B.displacementBias,W.wireframeLinewidth=B.wireframeLinewidth,W.linewidth=B.linewidth,F.isPointLight===!0&&W.isMeshDistanceMaterial===!0&&(i.properties.get(W).light=F),W}function T(C,B,F,D,W){if(C.visible===!1)return;if(C.layers.test(B.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&W===3)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(F.matrixWorldInverse,C.matrixWorld);const G=e.update(C),Y=C.material;if(Array.isArray(Y)){const H=G.groups;for(let $=0,K=H.length;$<K;$++){const ie=H[$],ne=Y[ie.materialIndex];if(ne&&ne.visible){const fe=v(C,ne,D,W);C.onBeforeShadow(i,C,B,F,G,fe,ie),i.renderBufferDirect(F,null,G,fe,C,ie),C.onAfterShadow(i,C,B,F,G,fe,ie)}}}else if(Y.visible){const H=v(C,Y,D,W);C.onBeforeShadow(i,C,B,F,G,H,null),i.renderBufferDirect(F,null,G,H,C,null),C.onAfterShadow(i,C,B,F,G,H,null)}}const j=C.children;for(let G=0,Y=j.length;G<Y;G++)T(j[G],B,F,D,W)}function O(C){C.target.removeEventListener("dispose",O);for(const B in c){const F=c[B],D=C.target.uuid;D in F&&(F[D].dispose(),delete F[D])}}this.render=function(C,B,F){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||C.length===0)return;const D=i.getRenderTarget(),W=i.getActiveCubeFace(),j=i.getActiveMipmapLevel(),G=i.state;G.setBlending(0),G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);const Y=m!==3&&this.type===3,H=m===3&&this.type!==3;for(let $=0,K=C.length;$<K;$++){const ie=C[$],ne=ie.shadow;if(ne===void 0){console.warn("THREE.WebGLShadowMap:",ie,"has no shadow.");continue}if(ne.autoUpdate===!1&&ne.needsUpdate===!1)continue;r.copy(ne.mapSize);const fe=ne.getFrameExtents();if(r.multiply(fe),a.copy(ne.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(a.x=Math.floor(u/fe.x),r.x=a.x*fe.x,ne.mapSize.x=a.x),r.y>u&&(a.y=Math.floor(u/fe.y),r.y=a.y*fe.y,ne.mapSize.y=a.y)),ne.map===null||Y===!0||H===!0){const ee=this.type!==3?{minFilter:St,magFilter:St}:{};ne.map!==null&&ne.map.dispose(),ne.map=new dn(r.x,r.y,ee),ne.map.texture.name=ie.name+".shadowMap",ne.camera.updateProjectionMatrix()}i.setRenderTarget(ne.map),i.clear();const ve=ne.getViewportCount();for(let ee=0;ee<ve;ee++){const te=ne.getViewport(ee);s.set(a.x*te.x,a.y*te.y,a.x*te.z,a.y*te.w),G.viewport(s),ne.updateMatrices(ie,ee),n=ne.getFrustum(),T(B,F,ne.camera,ie,this.type)}ne.isPointLightShadow!==!0&&this.type===3&&g(ne,F),ne.needsUpdate=!1}m=this.type,f.needsUpdate=!1,i.setRenderTarget(D,W,j)}}const su={[qo]:1,[Yo]:6,[Zo]:7,[Ko]:5,[jo]:0,[$o]:2,[Qo]:4,[Jo]:3};function ou(i,e){const t=new function(){let y=!1;const U=new qe;let z=null;const ae=new qe(0,0,0,0);return{setMask:function(N){z===N||y||(i.colorMask(N,N,N,N),z=N)},setLocked:function(N){y=N},setClear:function(N,Z,J,Q,ue){ue===!0&&(N*=Q,Z*=Q,J*=Q),U.set(N,Z,J,Q),ae.equals(U)===!1&&(i.clearColor(N,Z,J,Q),ae.copy(U))},reset:function(){y=!1,z=null,ae.set(-1,0,0,0)}}},n=new function(){let y=!1,U=!1,z=null,ae=null,N=null;return{setReversed:function(Z){if(U!==Z){const J=e.get("EXT_clip_control");U?J.clipControlEXT(J.LOWER_LEFT_EXT,J.ZERO_TO_ONE_EXT):J.clipControlEXT(J.LOWER_LEFT_EXT,J.NEGATIVE_ONE_TO_ONE_EXT);const Q=N;N=null,this.setClear(Q)}U=Z},getReversed:function(){return U},setTest:function(Z){Z?me(i.DEPTH_TEST):ce(i.DEPTH_TEST)},setMask:function(Z){z===Z||y||(i.depthMask(Z),z=Z)},setFunc:function(Z){if(U&&(Z=su[Z]),ae!==Z){switch(Z){case 0:i.depthFunc(i.NEVER);break;case 1:i.depthFunc(i.ALWAYS);break;case 2:i.depthFunc(i.LESS);break;case 3:default:i.depthFunc(i.LEQUAL);break;case 4:i.depthFunc(i.EQUAL);break;case 5:i.depthFunc(i.GEQUAL);break;case 6:i.depthFunc(i.GREATER);break;case 7:i.depthFunc(i.NOTEQUAL)}ae=Z}},setLocked:function(Z){y=Z},setClear:function(Z){N!==Z&&(U&&(Z=1-Z),i.clearDepth(Z),N=Z)},reset:function(){y=!1,z=null,ae=null,N=null,U=!1}}},r=new function(){let y=!1,U=null,z=null,ae=null,N=null,Z=null,J=null,Q=null,ue=null;return{setTest:function(he){y||(he?me(i.STENCIL_TEST):ce(i.STENCIL_TEST))},setMask:function(he){U===he||y||(i.stencilMask(he),U=he)},setFunc:function(he,ge,Se){z===he&&ae===ge&&N===Se||(i.stencilFunc(he,ge,Se),z=he,ae=ge,N=Se)},setOp:function(he,ge,Se){Z===he&&J===ge&&Q===Se||(i.stencilOp(he,ge,Se),Z=he,J=ge,Q=Se)},setLocked:function(he){y=he},setClear:function(he){ue!==he&&(i.clearStencil(he),ue=he)},reset:function(){y=!1,U=null,z=null,ae=null,N=null,Z=null,J=null,Q=null,ue=null}}},a=new WeakMap,s=new WeakMap;let l={},o={},c=new WeakMap,u=[],d=null,h=!1,p=null,_=null,x=null,f=null,m=null,g=null,v=null,T=new Fe(0,0,0),O=0,C=!1,B=null,F=null,D=null,W=null,j=null;const G=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Y=!1,H=0;const $=i.getParameter(i.VERSION);$.indexOf("WebGL")!==-1?(H=parseFloat(/^WebGL (\d)/.exec($)[1]),Y=H>=1):$.indexOf("OpenGL ES")!==-1&&(H=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),Y=H>=2);let K=null,ie={};const ne=i.getParameter(i.SCISSOR_BOX),fe=i.getParameter(i.VIEWPORT),ve=new qe().fromArray(ne),ee=new qe().fromArray(fe);function te(y,U,z,ae){const N=new Uint8Array(4),Z=i.createTexture();i.bindTexture(y,Z),i.texParameteri(y,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(y,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let J=0;J<z;J++)y===i.TEXTURE_3D||y===i.TEXTURE_2D_ARRAY?i.texImage3D(U,0,i.RGBA,1,1,ae,0,i.RGBA,i.UNSIGNED_BYTE,N):i.texImage2D(U+J,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,N);return Z}const oe={};function me(y){l[y]!==!0&&(i.enable(y),l[y]=!0)}function ce(y){l[y]!==!1&&(i.disable(y),l[y]=!1)}oe[i.TEXTURE_2D]=te(i.TEXTURE_2D,i.TEXTURE_2D,1),oe[i.TEXTURE_CUBE_MAP]=te(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),oe[i.TEXTURE_2D_ARRAY]=te(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),oe[i.TEXTURE_3D]=te(i.TEXTURE_3D,i.TEXTURE_3D,1,1),t.setClear(0,0,0,1),n.setClear(1),r.setClear(0),me(i.DEPTH_TEST),n.setFunc(3),X(!1),P(1),me(i.CULL_FACE),R(0);const S={[on]:i.FUNC_ADD,[Lo]:i.FUNC_SUBTRACT,[Uo]:i.FUNC_REVERSE_SUBTRACT};S[103]=i.MIN,S[104]=i.MAX;const E={[Do]:i.ZERO,[Io]:i.ONE,[No]:i.SRC_COLOR,[vr]:i.SRC_ALPHA,[Go]:i.SRC_ALPHA_SATURATE,[zo]:i.DST_COLOR,[Fo]:i.DST_ALPHA,[Oo]:i.ONE_MINUS_SRC_COLOR,[xr]:i.ONE_MINUS_SRC_ALPHA,[Ho]:i.ONE_MINUS_DST_COLOR,[Bo]:i.ONE_MINUS_DST_ALPHA,[Vo]:i.CONSTANT_COLOR,[ko]:i.ONE_MINUS_CONSTANT_COLOR,[Wo]:i.CONSTANT_ALPHA,[Xo]:i.ONE_MINUS_CONSTANT_ALPHA};function R(y,U,z,ae,N,Z,J,Q,ue,he){if(y!==0){if(h===!1&&(me(i.BLEND),h=!0),y===5)N=N||U,Z=Z||z,J=J||ae,U===_&&N===m||(i.blendEquationSeparate(S[U],S[N]),_=U,m=N),z===x&&ae===f&&Z===g&&J===v||(i.blendFuncSeparate(E[z],E[ae],E[Z],E[J]),x=z,f=ae,g=Z,v=J),Q.equals(T)!==!1&&ue===O||(i.blendColor(Q.r,Q.g,Q.b,ue),T.copy(Q),O=ue),p=y,C=!1;else if(y!==p||he!==C){if(_===on&&m===on||(i.blendEquation(i.FUNC_ADD),_=on,m=on),he)switch(y){case 1:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case 2:i.blendFunc(i.ONE,i.ONE);break;case 3:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case 4:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",y)}else switch(y){case 1:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case 2:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case 3:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case 4:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",y)}x=null,f=null,g=null,v=null,T.set(0,0,0),O=0,p=y,C=he}}else h===!0&&(ce(i.BLEND),h=!1)}function X(y){B!==y&&(y?i.frontFace(i.CW):i.frontFace(i.CCW),B=y)}function P(y){y!==0?(me(i.CULL_FACE),y!==F&&(y===1?i.cullFace(i.BACK):y===2?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ce(i.CULL_FACE),F=y}function V(y,U,z){y?(me(i.POLYGON_OFFSET_FILL),W===U&&j===z||(i.polygonOffset(U,z),W=U,j=z)):ce(i.POLYGON_OFFSET_FILL)}return{buffers:{color:t,depth:n,stencil:r},enable:me,disable:ce,bindFramebuffer:function(y,U){return o[y]!==U&&(i.bindFramebuffer(y,U),o[y]=U,y===i.DRAW_FRAMEBUFFER&&(o[i.FRAMEBUFFER]=U),y===i.FRAMEBUFFER&&(o[i.DRAW_FRAMEBUFFER]=U),!0)},drawBuffers:function(y,U){let z=u,ae=!1;if(y){z=c.get(U),z===void 0&&(z=[],c.set(U,z));const N=y.textures;if(z.length!==N.length||z[0]!==i.COLOR_ATTACHMENT0){for(let Z=0,J=N.length;Z<J;Z++)z[Z]=i.COLOR_ATTACHMENT0+Z;z.length=N.length,ae=!0}}else z[0]!==i.BACK&&(z[0]=i.BACK,ae=!0);ae&&i.drawBuffers(z)},useProgram:function(y){return d!==y&&(i.useProgram(y),d=y,!0)},setBlending:R,setMaterial:function(y,U){y.side===2?ce(i.CULL_FACE):me(i.CULL_FACE);let z=y.side===1;U&&(z=!z),X(z),y.blending===1&&y.transparent===!1?R(0):R(y.blending,y.blendEquation,y.blendSrc,y.blendDst,y.blendEquationAlpha,y.blendSrcAlpha,y.blendDstAlpha,y.blendColor,y.blendAlpha,y.premultipliedAlpha),n.setFunc(y.depthFunc),n.setTest(y.depthTest),n.setMask(y.depthWrite),t.setMask(y.colorWrite);const ae=y.stencilWrite;r.setTest(ae),ae&&(r.setMask(y.stencilWriteMask),r.setFunc(y.stencilFunc,y.stencilRef,y.stencilFuncMask),r.setOp(y.stencilFail,y.stencilZFail,y.stencilZPass)),V(y.polygonOffset,y.polygonOffsetFactor,y.polygonOffsetUnits),y.alphaToCoverage===!0?me(i.SAMPLE_ALPHA_TO_COVERAGE):ce(i.SAMPLE_ALPHA_TO_COVERAGE)},setFlipSided:X,setCullFace:P,setLineWidth:function(y){y!==D&&(Y&&i.lineWidth(y),D=y)},setPolygonOffset:V,setScissorTest:function(y){y?me(i.SCISSOR_TEST):ce(i.SCISSOR_TEST)},activeTexture:function(y){y===void 0&&(y=i.TEXTURE0+G-1),K!==y&&(i.activeTexture(y),K=y)},bindTexture:function(y,U,z){z===void 0&&(z=K===null?i.TEXTURE0+G-1:K);let ae=ie[z];ae===void 0&&(ae={type:void 0,texture:void 0},ie[z]=ae),ae.type===y&&ae.texture===U||(K!==z&&(i.activeTexture(z),K=z),i.bindTexture(y,U||oe[y]),ae.type=y,ae.texture=U)},unbindTexture:function(){const y=ie[K];y!==void 0&&y.type!==void 0&&(i.bindTexture(y.type,null),y.type=void 0,y.texture=void 0)},compressedTexImage2D:function(){try{i.compressedTexImage2D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}},compressedTexImage3D:function(){try{i.compressedTexImage3D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}},texImage2D:function(){try{i.texImage2D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}},texImage3D:function(){try{i.texImage3D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}},updateUBOMapping:function(y,U){let z=s.get(U);z===void 0&&(z=new WeakMap,s.set(U,z));let ae=z.get(y);ae===void 0&&(ae=i.getUniformBlockIndex(U,y.name),z.set(y,ae))},uniformBlockBinding:function(y,U){const z=s.get(U).get(y);a.get(U)!==z&&(i.uniformBlockBinding(U,z,y.__bindingPointIndex),a.set(U,z))},texStorage2D:function(){try{i.texStorage2D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}},texStorage3D:function(){try{i.texStorage3D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}},texSubImage2D:function(){try{i.texSubImage2D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}},texSubImage3D:function(){try{i.texSubImage3D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}},compressedTexSubImage2D:function(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}},compressedTexSubImage3D:function(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(y){console.error("THREE.WebGLState:",y)}},scissor:function(y){ve.equals(y)===!1&&(i.scissor(y.x,y.y,y.z,y.w),ve.copy(y))},viewport:function(y){ee.equals(y)===!1&&(i.viewport(y.x,y.y,y.z,y.w),ee.copy(y))},reset:function(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),n.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),l={},K=null,ie={},o={},c=new WeakMap,u=[],d=null,h=!1,p=null,_=null,x=null,f=null,m=null,g=null,v=null,T=new Fe(0,0,0),O=0,C=!1,B=null,F=null,D=null,W=null,j=null,ve.set(0,0,i.canvas.width,i.canvas.height),ee.set(0,0,i.canvas.width,i.canvas.height),t.reset(),n.reset(),r.reset()}}}function ho(i,e,t,n){const r=(function(a){switch(a){case qt:case qa:return{byteLength:1,components:1};case ni:case ja:case ii:return{byteLength:2,components:1};case wr:case Ar:return{byteLength:2,components:4};case un:case br:case Ot:return{byteLength:4,components:1};case Ya:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${a}.`)})(n);switch(t){case Ka:case Ja:return i*e;case $a:return i*e*2;case Qa:case Rr:return i*e/r.components*r.byteLength;case es:case Cr:return i*e*2/r.components*r.byteLength;case Za:return i*e*3/r.components*r.byteLength;case Lt:case Pr:return i*e*4/r.components*r.byteLength;case Pi:case Li:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Ui:case Di:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ur:case Ir:return Math.max(i,16)*Math.max(e,8)/4;case Lr:case Dr:return Math.max(i,8)*Math.max(e,8)/2;case Nr:case Or:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Fr:case Br:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case zr:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Hr:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Gr:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Vr:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case kr:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Wr:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Xr:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case qr:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case jr:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Yr:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Kr:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Zr:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Jr:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Ii:case $r:case Qr:return Math.ceil(i/4)*Math.ceil(e/4)*16;case ts:case ea:return Math.ceil(i/4)*Math.ceil(e/4)*8;case ta:case na:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function lu(i,e,t,n,r,a,s){const l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,o=typeof navigator<"u"&&/OculusBrowser/g.test(navigator.userAgent),c=new Oe,u=new WeakMap;let d;const h=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(S,E){return p?new OffscreenCanvas(S,E):Fi("canvas")}function x(S,E,R){let X=1;const P=ce(S);if((P.width>R||P.height>R)&&(X=R/Math.max(P.width,P.height)),X<1){if(typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&S instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&S instanceof ImageBitmap||typeof VideoFrame<"u"&&S instanceof VideoFrame){const V=Math.floor(X*P.width),y=Math.floor(X*P.height);d===void 0&&(d=_(V,y));const U=E?_(V,y):d;return U.width=V,U.height=y,U.getContext("2d").drawImage(S,0,0,V,y),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+P.width+"x"+P.height+") to ("+V+"x"+y+")."),U}return"data"in S&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+P.width+"x"+P.height+")."),S}return S}function f(S){return S.generateMipmaps}function m(S){i.generateMipmap(S)}function g(S){return S.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:S.isWebGL3DRenderTarget?i.TEXTURE_3D:S.isWebGLArrayRenderTarget||S.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function v(S,E,R,X,P=!1){if(S!==null){if(i[S]!==void 0)return i[S];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+S+"'")}let V=E;if(E===i.RED&&(R===i.FLOAT&&(V=i.R32F),R===i.HALF_FLOAT&&(V=i.R16F),R===i.UNSIGNED_BYTE&&(V=i.R8)),E===i.RED_INTEGER&&(R===i.UNSIGNED_BYTE&&(V=i.R8UI),R===i.UNSIGNED_SHORT&&(V=i.R16UI),R===i.UNSIGNED_INT&&(V=i.R32UI),R===i.BYTE&&(V=i.R8I),R===i.SHORT&&(V=i.R16I),R===i.INT&&(V=i.R32I)),E===i.RG&&(R===i.FLOAT&&(V=i.RG32F),R===i.HALF_FLOAT&&(V=i.RG16F),R===i.UNSIGNED_BYTE&&(V=i.RG8)),E===i.RG_INTEGER&&(R===i.UNSIGNED_BYTE&&(V=i.RG8UI),R===i.UNSIGNED_SHORT&&(V=i.RG16UI),R===i.UNSIGNED_INT&&(V=i.RG32UI),R===i.BYTE&&(V=i.RG8I),R===i.SHORT&&(V=i.RG16I),R===i.INT&&(V=i.RG32I)),E===i.RGB_INTEGER&&(R===i.UNSIGNED_BYTE&&(V=i.RGB8UI),R===i.UNSIGNED_SHORT&&(V=i.RGB16UI),R===i.UNSIGNED_INT&&(V=i.RGB32UI),R===i.BYTE&&(V=i.RGB8I),R===i.SHORT&&(V=i.RGB16I),R===i.INT&&(V=i.RGB32I)),E===i.RGBA_INTEGER&&(R===i.UNSIGNED_BYTE&&(V=i.RGBA8UI),R===i.UNSIGNED_SHORT&&(V=i.RGBA16UI),R===i.UNSIGNED_INT&&(V=i.RGBA32UI),R===i.BYTE&&(V=i.RGBA8I),R===i.SHORT&&(V=i.RGBA16I),R===i.INT&&(V=i.RGBA32I)),E===i.RGB&&R===i.UNSIGNED_INT_5_9_9_9_REV&&(V=i.RGB9_E5),E===i.RGBA){const y=P?Ni:Ne.getTransfer(X);R===i.FLOAT&&(V=i.RGBA32F),R===i.HALF_FLOAT&&(V=i.RGBA16F),R===i.UNSIGNED_BYTE&&(V=y===Ge?i.SRGB8_ALPHA8:i.RGBA8),R===i.UNSIGNED_SHORT_4_4_4_4&&(V=i.RGBA4),R===i.UNSIGNED_SHORT_5_5_5_1&&(V=i.RGB5_A1)}return V!==i.R16F&&V!==i.R32F&&V!==i.RG16F&&V!==i.RG32F&&V!==i.RGBA16F&&V!==i.RGBA32F||e.get("EXT_color_buffer_float"),V}function T(S,E){let R;return S?E===null||E===un||E===Cn?R=i.DEPTH24_STENCIL8:E===Ot?R=i.DEPTH32F_STENCIL8:E===ni&&(R=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):E===null||E===un||E===Cn?R=i.DEPTH_COMPONENT24:E===Ot?R=i.DEPTH_COMPONENT32F:E===ni&&(R=i.DEPTH_COMPONENT16),R}function O(S,E){return f(S)===!0||S.isFramebufferTexture&&S.minFilter!==St&&S.minFilter!==Pt?Math.log2(Math.max(E.width,E.height))+1:S.mipmaps!==void 0&&S.mipmaps.length>0?S.mipmaps.length:S.isCompressedTexture&&Array.isArray(S.image)?E.mipmaps.length:1}function C(S){const E=S.target;E.removeEventListener("dispose",C),(function(R){const X=n.get(R);if(X.__webglInit===void 0)return;const P=R.source,V=h.get(P);if(V){const y=V[X.__cacheKey];y.usedTimes--,y.usedTimes===0&&F(R),Object.keys(V).length===0&&h.delete(P)}n.remove(R)})(E),E.isVideoTexture&&u.delete(E)}function B(S){const E=S.target;E.removeEventListener("dispose",B),(function(R){const X=n.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),n.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let V=0;V<6;V++){if(Array.isArray(X.__webglFramebuffer[V]))for(let y=0;y<X.__webglFramebuffer[V].length;y++)i.deleteFramebuffer(X.__webglFramebuffer[V][y]);else i.deleteFramebuffer(X.__webglFramebuffer[V]);X.__webglDepthbuffer&&i.deleteRenderbuffer(X.__webglDepthbuffer[V])}else{if(Array.isArray(X.__webglFramebuffer))for(let V=0;V<X.__webglFramebuffer.length;V++)i.deleteFramebuffer(X.__webglFramebuffer[V]);else i.deleteFramebuffer(X.__webglFramebuffer);if(X.__webglDepthbuffer&&i.deleteRenderbuffer(X.__webglDepthbuffer),X.__webglMultisampledFramebuffer&&i.deleteFramebuffer(X.__webglMultisampledFramebuffer),X.__webglColorRenderbuffer)for(let V=0;V<X.__webglColorRenderbuffer.length;V++)X.__webglColorRenderbuffer[V]&&i.deleteRenderbuffer(X.__webglColorRenderbuffer[V]);X.__webglDepthRenderbuffer&&i.deleteRenderbuffer(X.__webglDepthRenderbuffer)}const P=R.textures;for(let V=0,y=P.length;V<y;V++){const U=n.get(P[V]);U.__webglTexture&&(i.deleteTexture(U.__webglTexture),s.memory.textures--),n.remove(P[V])}n.remove(R)})(E)}function F(S){const E=n.get(S);i.deleteTexture(E.__webglTexture);const R=S.source;delete h.get(R)[E.__cacheKey],s.memory.textures--}let D=0;function W(S,E){const R=n.get(S);if(S.isVideoTexture&&(function(X){const P=s.render.frame;u.get(X)!==P&&(u.set(X,P),X.update())})(S),S.isRenderTargetTexture===!1&&S.version>0&&R.__version!==S.version){const X=S.image;if(X===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else{if(X.complete!==!1)return void K(R,S,E);console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete")}}t.bindTexture(i.TEXTURE_2D,R.__webglTexture,i.TEXTURE0+E)}const j={[Er]:i.REPEAT,[ln]:i.CLAMP_TO_EDGE,[yr]:i.MIRRORED_REPEAT},G={[St]:i.NEAREST,[el]:i.NEAREST_MIPMAP_NEAREST,[Ci]:i.NEAREST_MIPMAP_LINEAR,[Pt]:i.LINEAR,[Tr]:i.LINEAR_MIPMAP_NEAREST,[cn]:i.LINEAR_MIPMAP_LINEAR},Y={[tl]:i.NEVER,[ll]:i.ALWAYS,[nl]:i.LESS,[rl]:i.LEQUAL,[il]:i.EQUAL,[ol]:i.GEQUAL,[al]:i.GREATER,[sl]:i.NOTEQUAL};function H(S,E){if(E.type!==Ot||e.has("OES_texture_float_linear")!==!1||E.magFilter!==Pt&&E.magFilter!==Tr&&E.magFilter!==Ci&&E.magFilter!==cn&&E.minFilter!==Pt&&E.minFilter!==Tr&&E.minFilter!==Ci&&E.minFilter!==cn||console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(S,i.TEXTURE_WRAP_S,j[E.wrapS]),i.texParameteri(S,i.TEXTURE_WRAP_T,j[E.wrapT]),S!==i.TEXTURE_3D&&S!==i.TEXTURE_2D_ARRAY||i.texParameteri(S,i.TEXTURE_WRAP_R,j[E.wrapR]),i.texParameteri(S,i.TEXTURE_MAG_FILTER,G[E.magFilter]),i.texParameteri(S,i.TEXTURE_MIN_FILTER,G[E.minFilter]),E.compareFunction&&(i.texParameteri(S,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(S,i.TEXTURE_COMPARE_FUNC,Y[E.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===St||E.minFilter!==Ci&&E.minFilter!==cn||E.type===Ot&&e.has("OES_texture_float_linear")===!1)return;if(E.anisotropy>1||n.get(E).__currentAnisotropy){const R=e.get("EXT_texture_filter_anisotropic");i.texParameterf(S,R.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,r.getMaxAnisotropy())),n.get(E).__currentAnisotropy=E.anisotropy}}}function $(S,E){let R=!1;S.__webglInit===void 0&&(S.__webglInit=!0,E.addEventListener("dispose",C));const X=E.source;let P=h.get(X);P===void 0&&(P={},h.set(X,P));const V=(function(y){const U=[];return U.push(y.wrapS),U.push(y.wrapT),U.push(y.wrapR||0),U.push(y.magFilter),U.push(y.minFilter),U.push(y.anisotropy),U.push(y.internalFormat),U.push(y.format),U.push(y.type),U.push(y.generateMipmaps),U.push(y.premultiplyAlpha),U.push(y.flipY),U.push(y.unpackAlignment),U.push(y.colorSpace),U.join()})(E);if(V!==S.__cacheKey){P[V]===void 0&&(P[V]={texture:i.createTexture(),usedTimes:0},s.memory.textures++,R=!0),P[V].usedTimes++;const y=P[S.__cacheKey];y!==void 0&&(P[S.__cacheKey].usedTimes--,y.usedTimes===0&&F(E)),S.__cacheKey=V,S.__webglTexture=P[V].texture}return R}function K(S,E,R){let X=i.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(X=i.TEXTURE_2D_ARRAY),E.isData3DTexture&&(X=i.TEXTURE_3D);const P=$(S,E),V=E.source;t.bindTexture(X,S.__webglTexture,i.TEXTURE0+R);const y=n.get(V);if(V.version!==y.__version||P===!0){t.activeTexture(i.TEXTURE0+R);const U=Ne.getPrimaries(Ne.workingColorSpace),z=E.colorSpace===hn?null:Ne.getPrimaries(E.colorSpace),ae=E.colorSpace===hn||U===z?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ae);let N=x(E.image,!1,r.maxTextureSize);N=me(E,N);const Z=a.convert(E.format,E.colorSpace),J=a.convert(E.type);let Q,ue=v(E.internalFormat,Z,J,E.colorSpace,E.isVideoTexture);H(X,E);const he=E.mipmaps,ge=E.isVideoTexture!==!0,Se=y.__version===void 0||P===!0,Le=V.dataReady,Pe=O(E,N);if(E.isDepthTexture)ue=T(E.format===Pn,E.type),Se&&(ge?t.texStorage2D(i.TEXTURE_2D,1,ue,N.width,N.height):t.texImage2D(i.TEXTURE_2D,0,ue,N.width,N.height,0,Z,J,null));else if(E.isDataTexture)if(he.length>0){ge&&Se&&t.texStorage2D(i.TEXTURE_2D,Pe,ue,he[0].width,he[0].height);for(let _e=0,Ie=he.length;_e<Ie;_e++)Q=he[_e],ge?Le&&t.texSubImage2D(i.TEXTURE_2D,_e,0,0,Q.width,Q.height,Z,J,Q.data):t.texImage2D(i.TEXTURE_2D,_e,ue,Q.width,Q.height,0,Z,J,Q.data);E.generateMipmaps=!1}else ge?(Se&&t.texStorage2D(i.TEXTURE_2D,Pe,ue,N.width,N.height),Le&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,N.width,N.height,Z,J,N.data)):t.texImage2D(i.TEXTURE_2D,0,ue,N.width,N.height,0,Z,J,N.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){ge&&Se&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Pe,ue,he[0].width,he[0].height,N.depth);for(let _e=0,Ie=he.length;_e<Ie;_e++)if(Q=he[_e],E.format!==Lt)if(Z!==null)if(ge){if(Le)if(E.layerUpdates.size>0){const ze=ho(Q.width,Q.height,E.format,E.type);for(const Ve of E.layerUpdates){const pe=Q.data.subarray(Ve*ze/Q.data.BYTES_PER_ELEMENT,(Ve+1)*ze/Q.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,_e,0,0,Ve,Q.width,Q.height,1,Z,pe)}E.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,_e,0,0,0,Q.width,Q.height,N.depth,Z,Q.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,_e,ue,Q.width,Q.height,N.depth,0,Q.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else ge?Le&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,_e,0,0,0,Q.width,Q.height,N.depth,Z,J,Q.data):t.texImage3D(i.TEXTURE_2D_ARRAY,_e,ue,Q.width,Q.height,N.depth,0,Z,J,Q.data)}else{ge&&Se&&t.texStorage2D(i.TEXTURE_2D,Pe,ue,he[0].width,he[0].height);for(let _e=0,Ie=he.length;_e<Ie;_e++)Q=he[_e],E.format!==Lt?Z!==null?ge?Le&&t.compressedTexSubImage2D(i.TEXTURE_2D,_e,0,0,Q.width,Q.height,Z,Q.data):t.compressedTexImage2D(i.TEXTURE_2D,_e,ue,Q.width,Q.height,0,Q.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):ge?Le&&t.texSubImage2D(i.TEXTURE_2D,_e,0,0,Q.width,Q.height,Z,J,Q.data):t.texImage2D(i.TEXTURE_2D,_e,ue,Q.width,Q.height,0,Z,J,Q.data)}else if(E.isDataArrayTexture)if(ge){if(Se&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Pe,ue,N.width,N.height,N.depth),Le)if(E.layerUpdates.size>0){const _e=ho(N.width,N.height,E.format,E.type);for(const Ie of E.layerUpdates){const ze=N.data.subarray(Ie*_e/N.data.BYTES_PER_ELEMENT,(Ie+1)*_e/N.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Ie,N.width,N.height,1,Z,J,ze)}E.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,N.width,N.height,N.depth,Z,J,N.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,ue,N.width,N.height,N.depth,0,Z,J,N.data);else if(E.isData3DTexture)ge?(Se&&t.texStorage3D(i.TEXTURE_3D,Pe,ue,N.width,N.height,N.depth),Le&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,N.width,N.height,N.depth,Z,J,N.data)):t.texImage3D(i.TEXTURE_3D,0,ue,N.width,N.height,N.depth,0,Z,J,N.data);else if(E.isFramebufferTexture){if(Se)if(ge)t.texStorage2D(i.TEXTURE_2D,Pe,ue,N.width,N.height);else{let _e=N.width,Ie=N.height;for(let ze=0;ze<Pe;ze++)t.texImage2D(i.TEXTURE_2D,ze,ue,_e,Ie,0,Z,J,null),_e>>=1,Ie>>=1}}else if(he.length>0){if(ge&&Se){const _e=ce(he[0]);t.texStorage2D(i.TEXTURE_2D,Pe,ue,_e.width,_e.height)}for(let _e=0,Ie=he.length;_e<Ie;_e++)Q=he[_e],ge?Le&&t.texSubImage2D(i.TEXTURE_2D,_e,0,0,Z,J,Q):t.texImage2D(i.TEXTURE_2D,_e,ue,Z,J,Q);E.generateMipmaps=!1}else if(ge){if(Se){const _e=ce(N);t.texStorage2D(i.TEXTURE_2D,Pe,ue,_e.width,_e.height)}Le&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,Z,J,N)}else t.texImage2D(i.TEXTURE_2D,0,ue,Z,J,N);f(E)&&m(X),y.__version=V.version,E.onUpdate&&E.onUpdate(E)}S.__version=E.version}function ie(S,E,R,X,P,V){const y=a.convert(R.format,R.colorSpace),U=a.convert(R.type),z=v(R.internalFormat,y,U,R.colorSpace),ae=n.get(E),N=n.get(R);if(N.__renderTarget=E,!ae.__hasExternalTextures){const Z=Math.max(1,E.width>>V),J=Math.max(1,E.height>>V);P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY?t.texImage3D(P,V,z,Z,J,E.depth,0,y,U,null):t.texImage2D(P,V,z,Z,J,0,y,U,null)}t.bindFramebuffer(i.FRAMEBUFFER,S),oe(E)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,X,P,N.__webglTexture,0,te(E)):(P===i.TEXTURE_2D||P>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&P<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,X,P,N.__webglTexture,V),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ne(S,E,R){if(i.bindRenderbuffer(i.RENDERBUFFER,S),E.depthBuffer){const X=E.depthTexture,P=X&&X.isDepthTexture?X.type:null,V=T(E.stencilBuffer,P),y=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,U=te(E);oe(E)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,U,V,E.width,E.height):R?i.renderbufferStorageMultisample(i.RENDERBUFFER,U,V,E.width,E.height):i.renderbufferStorage(i.RENDERBUFFER,V,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,y,i.RENDERBUFFER,S)}else{const X=E.textures;for(let P=0;P<X.length;P++){const V=X[P],y=a.convert(V.format,V.colorSpace),U=a.convert(V.type),z=v(V.internalFormat,y,U,V.colorSpace),ae=te(E);R&&oe(E)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,ae,z,E.width,E.height):oe(E)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ae,z,E.width,E.height):i.renderbufferStorage(i.RENDERBUFFER,z,E.width,E.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function fe(S){const E=n.get(S),R=S.isWebGLCubeRenderTarget===!0;if(E.__boundDepthTexture!==S.depthTexture){const X=S.depthTexture;if(E.__depthDisposeCallback&&E.__depthDisposeCallback(),X){const P=()=>{delete E.__boundDepthTexture,delete E.__depthDisposeCallback,X.removeEventListener("dispose",P)};X.addEventListener("dispose",P),E.__depthDisposeCallback=P}E.__boundDepthTexture=X}if(S.depthTexture&&!E.__autoAllocateDepthBuffer){if(R)throw new Error("target.depthTexture not supported in Cube render targets");(function(X,P){if(P&&P.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,X),!P.depthTexture||!P.depthTexture.isDepthTexture)throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const V=n.get(P.depthTexture);V.__renderTarget=P,V.__webglTexture&&P.depthTexture.image.width===P.width&&P.depthTexture.image.height===P.height||(P.depthTexture.image.width=P.width,P.depthTexture.image.height=P.height,P.depthTexture.needsUpdate=!0),W(P.depthTexture,0);const y=V.__webglTexture,U=te(P);if(P.depthTexture.format===ri)oe(P)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,y,0,U):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,y,0);else{if(P.depthTexture.format!==Pn)throw new Error("Unknown depthTexture format");oe(P)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,y,0,U):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,y,0)}})(E.__webglFramebuffer,S)}else if(R){E.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(t.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer[X]),E.__webglDepthbuffer[X]===void 0)E.__webglDepthbuffer[X]=i.createRenderbuffer(),ne(E.__webglDepthbuffer[X],S,!1);else{const P=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,V=E.__webglDepthbuffer[X];i.bindRenderbuffer(i.RENDERBUFFER,V),i.framebufferRenderbuffer(i.FRAMEBUFFER,P,i.RENDERBUFFER,V)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer===void 0)E.__webglDepthbuffer=i.createRenderbuffer(),ne(E.__webglDepthbuffer,S,!1);else{const X=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,P=E.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,P),i.framebufferRenderbuffer(i.FRAMEBUFFER,X,i.RENDERBUFFER,P)}t.bindFramebuffer(i.FRAMEBUFFER,null)}const ve=[],ee=[];function te(S){return Math.min(r.maxSamples,S.samples)}function oe(S){const E=n.get(S);return S.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function me(S,E){const R=S.colorSpace,X=S.format,P=S.type;return S.isCompressedTexture===!0||S.isVideoTexture===!0||R!==Ln&&R!==hn&&(Ne.getTransfer(R)===Ge?X===Lt&&P===qt||console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",R)),E}function ce(S){return typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement?(c.width=S.naturalWidth||S.width,c.height=S.naturalHeight||S.height):typeof VideoFrame<"u"&&S instanceof VideoFrame?(c.width=S.displayWidth,c.height=S.displayHeight):(c.width=S.width,c.height=S.height),c}this.allocateTextureUnit=function(){const S=D;return S>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+S+" texture units while this GPU supports only "+r.maxTextures),D+=1,S},this.resetTextureUnits=function(){D=0},this.setTexture2D=W,this.setTexture2DArray=function(S,E){const R=n.get(S);S.version>0&&R.__version!==S.version?K(R,S,E):t.bindTexture(i.TEXTURE_2D_ARRAY,R.__webglTexture,i.TEXTURE0+E)},this.setTexture3D=function(S,E){const R=n.get(S);S.version>0&&R.__version!==S.version?K(R,S,E):t.bindTexture(i.TEXTURE_3D,R.__webglTexture,i.TEXTURE0+E)},this.setTextureCube=function(S,E){const R=n.get(S);S.version>0&&R.__version!==S.version?(function(X,P,V){if(P.image.length!==6)return;const y=$(X,P),U=P.source;t.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture,i.TEXTURE0+V);const z=n.get(U);if(U.version!==z.__version||y===!0){t.activeTexture(i.TEXTURE0+V);const ae=Ne.getPrimaries(Ne.workingColorSpace),N=P.colorSpace===hn?null:Ne.getPrimaries(P.colorSpace),Z=P.colorSpace===hn||ae===N?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,P.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,P.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,P.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Z);const J=P.isCompressedTexture||P.image[0].isCompressedTexture,Q=P.image[0]&&P.image[0].isDataTexture,ue=[];for(let pe=0;pe<6;pe++)ue[pe]=J||Q?Q?P.image[pe].image:P.image[pe]:x(P.image[pe],!0,r.maxCubemapSize),ue[pe]=me(P,ue[pe]);const he=ue[0],ge=a.convert(P.format,P.colorSpace),Se=a.convert(P.type),Le=v(P.internalFormat,ge,Se,P.colorSpace),Pe=P.isVideoTexture!==!0,_e=z.__version===void 0||y===!0,Ie=U.dataReady;let ze,Ve=O(P,he);if(H(i.TEXTURE_CUBE_MAP,P),J){Pe&&_e&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Ve,Le,he.width,he.height);for(let pe=0;pe<6;pe++){ze=ue[pe].mipmaps;for(let Re=0;Re<ze.length;Re++){const He=ze[Re];P.format!==Lt?ge!==null?Pe?Ie&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Re,0,0,He.width,He.height,ge,He.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Re,Le,He.width,He.height,0,He.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Pe?Ie&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Re,0,0,He.width,He.height,ge,Se,He.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Re,Le,He.width,He.height,0,ge,Se,He.data)}}}else{if(ze=P.mipmaps,Pe&&_e){ze.length>0&&Ve++;const pe=ce(ue[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Ve,Le,pe.width,pe.height)}for(let pe=0;pe<6;pe++)if(Q){Pe?Ie&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0,0,0,ue[pe].width,ue[pe].height,ge,Se,ue[pe].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0,Le,ue[pe].width,ue[pe].height,0,ge,Se,ue[pe].data);for(let Re=0;Re<ze.length;Re++){const He=ze[Re].image[pe].image;Pe?Ie&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Re+1,0,0,He.width,He.height,ge,Se,He.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Re+1,Le,He.width,He.height,0,ge,Se,He.data)}}else{Pe?Ie&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0,0,0,ge,Se,ue[pe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0,Le,ge,Se,ue[pe]);for(let Re=0;Re<ze.length;Re++){const He=ze[Re];Pe?Ie&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Re+1,0,0,ge,Se,He.image[pe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Re+1,Le,ge,Se,He.image[pe])}}}f(P)&&m(i.TEXTURE_CUBE_MAP),z.__version=U.version,P.onUpdate&&P.onUpdate(P)}X.__version=P.version})(R,S,E):t.bindTexture(i.TEXTURE_CUBE_MAP,R.__webglTexture,i.TEXTURE0+E)},this.rebindTextures=function(S,E,R){const X=n.get(S);E!==void 0&&ie(X.__webglFramebuffer,S,S.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),R!==void 0&&fe(S)},this.setupRenderTarget=function(S){const E=S.texture,R=n.get(S),X=n.get(E);S.addEventListener("dispose",B);const P=S.textures,V=S.isWebGLCubeRenderTarget===!0,y=P.length>1;if(y||(X.__webglTexture===void 0&&(X.__webglTexture=i.createTexture()),X.__version=E.version,s.memory.textures++),V){R.__webglFramebuffer=[];for(let U=0;U<6;U++)if(E.mipmaps&&E.mipmaps.length>0){R.__webglFramebuffer[U]=[];for(let z=0;z<E.mipmaps.length;z++)R.__webglFramebuffer[U][z]=i.createFramebuffer()}else R.__webglFramebuffer[U]=i.createFramebuffer()}else{if(E.mipmaps&&E.mipmaps.length>0){R.__webglFramebuffer=[];for(let U=0;U<E.mipmaps.length;U++)R.__webglFramebuffer[U]=i.createFramebuffer()}else R.__webglFramebuffer=i.createFramebuffer();if(y)for(let U=0,z=P.length;U<z;U++){const ae=n.get(P[U]);ae.__webglTexture===void 0&&(ae.__webglTexture=i.createTexture(),s.memory.textures++)}if(S.samples>0&&oe(S)===!1){R.__webglMultisampledFramebuffer=i.createFramebuffer(),R.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,R.__webglMultisampledFramebuffer);for(let U=0;U<P.length;U++){const z=P[U];R.__webglColorRenderbuffer[U]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,R.__webglColorRenderbuffer[U]);const ae=a.convert(z.format,z.colorSpace),N=a.convert(z.type),Z=v(z.internalFormat,ae,N,z.colorSpace,S.isXRRenderTarget===!0),J=te(S);i.renderbufferStorageMultisample(i.RENDERBUFFER,J,Z,S.width,S.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+U,i.RENDERBUFFER,R.__webglColorRenderbuffer[U])}i.bindRenderbuffer(i.RENDERBUFFER,null),S.depthBuffer&&(R.__webglDepthRenderbuffer=i.createRenderbuffer(),ne(R.__webglDepthRenderbuffer,S,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(V){t.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture),H(i.TEXTURE_CUBE_MAP,E);for(let U=0;U<6;U++)if(E.mipmaps&&E.mipmaps.length>0)for(let z=0;z<E.mipmaps.length;z++)ie(R.__webglFramebuffer[U][z],S,E,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+U,z);else ie(R.__webglFramebuffer[U],S,E,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+U,0);f(E)&&m(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(y){for(let U=0,z=P.length;U<z;U++){const ae=P[U],N=n.get(ae);t.bindTexture(i.TEXTURE_2D,N.__webglTexture),H(i.TEXTURE_2D,ae),ie(R.__webglFramebuffer,S,ae,i.COLOR_ATTACHMENT0+U,i.TEXTURE_2D,0),f(ae)&&m(i.TEXTURE_2D)}t.unbindTexture()}else{let U=i.TEXTURE_2D;if((S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(U=S.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(U,X.__webglTexture),H(U,E),E.mipmaps&&E.mipmaps.length>0)for(let z=0;z<E.mipmaps.length;z++)ie(R.__webglFramebuffer[z],S,E,i.COLOR_ATTACHMENT0,U,z);else ie(R.__webglFramebuffer,S,E,i.COLOR_ATTACHMENT0,U,0);f(E)&&m(U),t.unbindTexture()}S.depthBuffer&&fe(S)},this.updateRenderTargetMipmap=function(S){const E=S.textures;for(let R=0,X=E.length;R<X;R++){const P=E[R];if(f(P)){const V=g(S),y=n.get(P).__webglTexture;t.bindTexture(V,y),m(V),t.unbindTexture()}}},this.updateMultisampleRenderTarget=function(S){if(S.samples>0){if(oe(S)===!1){const E=S.textures,R=S.width,X=S.height;let P=i.COLOR_BUFFER_BIT;const V=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,y=n.get(S),U=E.length>1;if(U)for(let z=0;z<E.length;z++)t.bindFramebuffer(i.FRAMEBUFFER,y.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+z,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+z,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,y.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,y.__webglFramebuffer);for(let z=0;z<E.length;z++){if(S.resolveDepthBuffer&&(S.depthBuffer&&(P|=i.DEPTH_BUFFER_BIT),S.stencilBuffer&&S.resolveStencilBuffer&&(P|=i.STENCIL_BUFFER_BIT)),U){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,y.__webglColorRenderbuffer[z]);const ae=n.get(E[z]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,ae,0)}i.blitFramebuffer(0,0,R,X,0,0,R,X,P,i.NEAREST),o===!0&&(ve.length=0,ee.length=0,ve.push(i.COLOR_ATTACHMENT0+z),S.depthBuffer&&S.resolveDepthBuffer===!1&&(ve.push(V),ee.push(V),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,ee)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ve))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),U)for(let z=0;z<E.length;z++){t.bindFramebuffer(i.FRAMEBUFFER,y.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+z,i.RENDERBUFFER,y.__webglColorRenderbuffer[z]);const ae=n.get(E[z]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,y.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+z,i.TEXTURE_2D,ae,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,y.__webglMultisampledFramebuffer)}else if(S.depthBuffer&&S.resolveDepthBuffer===!1&&o){const E=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[E])}}},this.setupDepthRenderbuffer=fe,this.setupFrameBufferTexture=ie,this.useMultisampledRTT=oe}function cu(i,e){return{convert:function(t,n=""){let r;const a=Ne.getTransfer(n);if(t===qt)return i.UNSIGNED_BYTE;if(t===wr)return i.UNSIGNED_SHORT_4_4_4_4;if(t===Ar)return i.UNSIGNED_SHORT_5_5_5_1;if(t===Ya)return i.UNSIGNED_INT_5_9_9_9_REV;if(t===qa)return i.BYTE;if(t===ja)return i.SHORT;if(t===ni)return i.UNSIGNED_SHORT;if(t===br)return i.INT;if(t===un)return i.UNSIGNED_INT;if(t===Ot)return i.FLOAT;if(t===ii)return i.HALF_FLOAT;if(t===Ka)return i.ALPHA;if(t===Za)return i.RGB;if(t===Lt)return i.RGBA;if(t===Ja)return i.LUMINANCE;if(t===$a)return i.LUMINANCE_ALPHA;if(t===ri)return i.DEPTH_COMPONENT;if(t===Pn)return i.DEPTH_STENCIL;if(t===Qa)return i.RED;if(t===Rr)return i.RED_INTEGER;if(t===es)return i.RG;if(t===Cr)return i.RG_INTEGER;if(t===Pr)return i.RGBA_INTEGER;if(t===Pi||t===Li||t===Ui||t===Di)if(a===Ge){if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r===null)return null;if(t===Pi)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(t===Li)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(t===Ui)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(t===Di)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else{if(r=e.get("WEBGL_compressed_texture_s3tc"),r===null)return null;if(t===Pi)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(t===Li)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(t===Ui)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(t===Di)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}if(t===Lr||t===Ur||t===Dr||t===Ir){if(r=e.get("WEBGL_compressed_texture_pvrtc"),r===null)return null;if(t===Lr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(t===Ur)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(t===Dr)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(t===Ir)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}if(t===Nr||t===Or||t===Fr){if(r=e.get("WEBGL_compressed_texture_etc"),r===null)return null;if(t===Nr||t===Or)return a===Ge?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(t===Fr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}if(t===Br||t===zr||t===Hr||t===Gr||t===Vr||t===kr||t===Wr||t===Xr||t===qr||t===jr||t===Yr||t===Kr||t===Zr||t===Jr){if(r=e.get("WEBGL_compressed_texture_astc"),r===null)return null;if(t===Br)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(t===zr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(t===Hr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(t===Gr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(t===Vr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(t===kr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(t===Wr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(t===Xr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(t===qr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(t===jr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(t===Yr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(t===Kr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(t===Zr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(t===Jr)return a===Ge?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}if(t===Ii||t===$r||t===Qr){if(r=e.get("EXT_texture_compression_bptc"),r===null)return null;if(t===Ii)return a===Ge?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(t===$r)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(t===Qr)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}if(t===ts||t===ea||t===ta||t===na){if(r=e.get("EXT_texture_compression_rgtc"),r===null)return null;if(t===Ii)return r.COMPRESSED_RED_RGTC1_EXT;if(t===ea)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(t===ta)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(t===na)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}return t===Cn?i.UNSIGNED_INT_24_8:i[t]!==void 0?i[t]:null}}}class uu extends vt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class lr extends dt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const hu={type:"move"};class Ia{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new lr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new lr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new b,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new b),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new lr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new b,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new b),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,a=null,s=null;const l=this._targetRay,o=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){s=!0;for(const x of e.hand.values()){const f=t.getJointPose(x,n),m=this._getHandJoint(c,x);f!==null&&(m.matrix.fromArray(f.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=f.radius),m.visible=f!==null}const u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],h=u.position.distanceTo(d.position),p=.02,_=.005;c.inputState.pinching&&h>p+_?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=p-_&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else o!==null&&e.gripSpace&&(a=t.getPose(e.gripSpace,n),a!==null&&(o.matrix.fromArray(a.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,a.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(a.linearVelocity)):o.hasLinearVelocity=!1,a.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(a.angularVelocity)):o.hasAngularVelocity=!1));l!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&a!==null&&(r=a),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,this.dispatchEvent(hu)))}return l!==null&&(l.visible=r!==null),o!==null&&(o.visible=a!==null),c!==null&&(c.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new lr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class du{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){const r=new st;e.properties.get(r).__webglTexture=t.texture,t.depthNear==n.depthNear&&t.depthFar==n.depthFar||(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new Xt({vertexShader:`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,fragmentShader:`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new _t(new pi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class fu extends In{constructor(e,t){super();const n=this;let r=null,a=1,s=null,l="local-floor",o=1,c=null,u=null,d=null,h=null,p=null,_=null;const x=new du,f=t.getContextAttributes();let m=null,g=null;const v=[],T=[],O=new Oe;let C=null;const B=new vt;B.viewport=new qe;const F=new vt;F.viewport=new qe;const D=[B,F],W=new uu;let j=null,G=null;function Y(ee){const te=T.indexOf(ee.inputSource);if(te===-1)return;const oe=v[te];oe!==void 0&&(oe.update(ee.inputSource,ee.frame,c||s),oe.dispatchEvent({type:ee.type,data:ee.inputSource}))}function H(){r.removeEventListener("select",Y),r.removeEventListener("selectstart",Y),r.removeEventListener("selectend",Y),r.removeEventListener("squeeze",Y),r.removeEventListener("squeezestart",Y),r.removeEventListener("squeezeend",Y),r.removeEventListener("end",H),r.removeEventListener("inputsourceschange",$);for(let ee=0;ee<v.length;ee++){const te=T[ee];te!==null&&(T[ee]=null,v[ee].disconnect(te))}j=null,G=null,x.reset(),e.setRenderTarget(m),p=null,h=null,d=null,r=null,g=null,ve.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(O.width,O.height,!1),n.dispatchEvent({type:"sessionend"})}function $(ee){for(let te=0;te<ee.removed.length;te++){const oe=ee.removed[te],me=T.indexOf(oe);me>=0&&(T[me]=null,v[me].disconnect(oe))}for(let te=0;te<ee.added.length;te++){const oe=ee.added[te];let me=T.indexOf(oe);if(me===-1){for(let S=0;S<v.length;S++){if(S>=T.length){T.push(oe),me=S;break}if(T[S]===null){T[S]=oe,me=S;break}}if(me===-1)break}const ce=v[me];ce&&ce.connect(oe)}}this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(ee){let te=v[ee];return te===void 0&&(te=new Ia,v[ee]=te),te.getTargetRaySpace()},this.getControllerGrip=function(ee){let te=v[ee];return te===void 0&&(te=new Ia,v[ee]=te),te.getGripSpace()},this.getHand=function(ee){let te=v[ee];return te===void 0&&(te=new Ia,v[ee]=te),te.getHandSpace()},this.setFramebufferScaleFactor=function(ee){a=ee,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(ee){l=ee,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||s},this.setReferenceSpace=function(ee){c=ee},this.getBaseLayer=function(){return h!==null?h:p},this.getBinding=function(){return d},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(ee){if(r=ee,r!==null){if(m=e.getRenderTarget(),r.addEventListener("select",Y),r.addEventListener("selectstart",Y),r.addEventListener("selectend",Y),r.addEventListener("squeeze",Y),r.addEventListener("squeezestart",Y),r.addEventListener("squeezeend",Y),r.addEventListener("end",H),r.addEventListener("inputsourceschange",$),f.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(O),r.renderState.layers===void 0){const te={antialias:f.antialias,alpha:!0,depth:f.depth,stencil:f.stencil,framebufferScaleFactor:a};p=new XRWebGLLayer(r,t,te),r.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),g=new dn(p.framebufferWidth,p.framebufferHeight,{format:Lt,type:qt,colorSpace:e.outputColorSpace,stencilBuffer:f.stencil})}else{let te=null,oe=null,me=null;f.depth&&(me=f.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,te=f.stencil?Pn:ri,oe=f.stencil?Cn:un);const ce={colorFormat:t.RGBA8,depthFormat:me,scaleFactor:a};d=new XRWebGLBinding(r,t),h=d.createProjectionLayer(ce),r.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),g=new dn(h.textureWidth,h.textureHeight,{format:Lt,type:qt,depthTexture:new ks(h.textureWidth,h.textureHeight,oe,void 0,void 0,void 0,void 0,void 0,void 0,te),stencilBuffer:f.stencil,colorSpace:e.outputColorSpace,samples:f.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1})}g.isXRRenderTarget=!0,this.setFoveation(o),c=null,s=await r.requestReferenceSpace(l),ve.setContext(r),ve.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};const K=new b,ie=new b;function ne(ee,te){te===null?ee.matrixWorld.copy(ee.matrix):ee.matrixWorld.multiplyMatrices(te.matrixWorld,ee.matrix),ee.matrixWorldInverse.copy(ee.matrixWorld).invert()}this.updateCamera=function(ee){if(r===null)return;let te=ee.near,oe=ee.far;x.texture!==null&&(x.depthNear>0&&(te=x.depthNear),x.depthFar>0&&(oe=x.depthFar)),W.near=F.near=B.near=te,W.far=F.far=B.far=oe,j===W.near&&G===W.far||(r.updateRenderState({depthNear:W.near,depthFar:W.far}),j=W.near,G=W.far),B.layers.mask=2|ee.layers.mask,F.layers.mask=4|ee.layers.mask,W.layers.mask=B.layers.mask|F.layers.mask;const me=ee.parent,ce=W.cameras;ne(W,me);for(let S=0;S<ce.length;S++)ne(ce[S],me);ce.length===2?(function(S,E,R){K.setFromMatrixPosition(E.matrixWorld),ie.setFromMatrixPosition(R.matrixWorld);const X=K.distanceTo(ie),P=E.projectionMatrix.elements,V=R.projectionMatrix.elements,y=P[14]/(P[10]-1),U=P[14]/(P[10]+1),z=(P[9]+1)/P[5],ae=(P[9]-1)/P[5],N=(P[8]-1)/P[0],Z=(V[8]+1)/V[0],J=y*N,Q=y*Z,ue=X/(-N+Z),he=ue*-N;if(E.matrixWorld.decompose(S.position,S.quaternion,S.scale),S.translateX(he),S.translateZ(ue),S.matrixWorld.compose(S.position,S.quaternion,S.scale),S.matrixWorldInverse.copy(S.matrixWorld).invert(),P[10]===-1)S.projectionMatrix.copy(E.projectionMatrix),S.projectionMatrixInverse.copy(E.projectionMatrixInverse);else{const ge=y+ue,Se=U+ue,Le=J-he,Pe=Q+(X-he),_e=z*U/Se*ge,Ie=ae*U/Se*ge;S.projectionMatrix.makePerspective(Le,Pe,_e,Ie,ge,Se),S.projectionMatrixInverse.copy(S.projectionMatrix).invert()}})(W,B,F):W.projectionMatrix.copy(B.projectionMatrix),(function(S,E,R){R===null?S.matrix.copy(E.matrixWorld):(S.matrix.copy(R.matrixWorld),S.matrix.invert(),S.matrix.multiply(E.matrixWorld)),S.matrix.decompose(S.position,S.quaternion,S.scale),S.updateMatrixWorld(!0),S.projectionMatrix.copy(E.projectionMatrix),S.projectionMatrixInverse.copy(E.projectionMatrixInverse),S.isPerspectiveCamera&&(S.fov=2*si*Math.atan(1/S.projectionMatrix.elements[5]),S.zoom=1)})(ee,W,me)},this.getCamera=function(){return W},this.getFoveation=function(){if(h!==null||p!==null)return o},this.setFoveation=function(ee){o=ee,h!==null&&(h.fixedFoveation=ee),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=ee)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(W)};let fe=null;const ve=new Ns;ve.setAnimationLoop((function(ee,te){if(u=te.getViewerPose(c||s),_=te,u!==null){const oe=u.views;p!==null&&(e.setRenderTargetFramebuffer(g,p.framebuffer),e.setRenderTarget(g));let me=!1;oe.length!==W.cameras.length&&(W.cameras.length=0,me=!0);for(let S=0;S<oe.length;S++){const E=oe[S];let R=null;if(p!==null)R=p.getViewport(E);else{const P=d.getViewSubImage(h,E);R=P.viewport,S===0&&(e.setRenderTargetTextures(g,P.colorTexture,h.ignoreDepthValues?void 0:P.depthStencilTexture),e.setRenderTarget(g))}let X=D[S];X===void 0&&(X=new vt,X.layers.enable(S),X.viewport=new qe,D[S]=X),X.matrix.fromArray(E.transform.matrix),X.matrix.decompose(X.position,X.quaternion,X.scale),X.projectionMatrix.fromArray(E.projectionMatrix),X.projectionMatrixInverse.copy(X.projectionMatrix).invert(),X.viewport.set(R.x,R.y,R.width,R.height),S===0&&(W.matrix.copy(X.matrix),W.matrix.decompose(W.position,W.quaternion,W.scale)),me===!0&&W.cameras.push(X)}const ce=r.enabledFeatures;if(ce&&ce.includes("depth-sensing")){const S=d.getDepthInformation(oe[0]);S&&S.isValid&&S.texture&&x.init(e,S,r.renderState)}}for(let oe=0;oe<v.length;oe++){const me=T[oe],ce=v[oe];me!==null&&ce!==void 0&&ce.update(me,te,c||s)}fe&&fe(ee,te),te.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:te}),_=null})),this.setAnimationLoop=function(ee){fe=ee},this.dispose=function(){}}}const Sn=new Gt,pu=new Ae;function mu(i,e){function t(r,a){r.matrixAutoUpdate===!0&&r.updateMatrix(),a.value.copy(r.matrix)}function n(r,a){r.opacity.value=a.opacity,a.color&&r.diffuse.value.copy(a.color),a.emissive&&r.emissive.value.copy(a.emissive).multiplyScalar(a.emissiveIntensity),a.map&&(r.map.value=a.map,t(a.map,r.mapTransform)),a.alphaMap&&(r.alphaMap.value=a.alphaMap,t(a.alphaMap,r.alphaMapTransform)),a.bumpMap&&(r.bumpMap.value=a.bumpMap,t(a.bumpMap,r.bumpMapTransform),r.bumpScale.value=a.bumpScale,a.side===1&&(r.bumpScale.value*=-1)),a.normalMap&&(r.normalMap.value=a.normalMap,t(a.normalMap,r.normalMapTransform),r.normalScale.value.copy(a.normalScale),a.side===1&&r.normalScale.value.negate()),a.displacementMap&&(r.displacementMap.value=a.displacementMap,t(a.displacementMap,r.displacementMapTransform),r.displacementScale.value=a.displacementScale,r.displacementBias.value=a.displacementBias),a.emissiveMap&&(r.emissiveMap.value=a.emissiveMap,t(a.emissiveMap,r.emissiveMapTransform)),a.specularMap&&(r.specularMap.value=a.specularMap,t(a.specularMap,r.specularMapTransform)),a.alphaTest>0&&(r.alphaTest.value=a.alphaTest);const s=e.get(a),l=s.envMap,o=s.envMapRotation;l&&(r.envMap.value=l,Sn.copy(o),Sn.x*=-1,Sn.y*=-1,Sn.z*=-1,l.isCubeTexture&&l.isRenderTargetTexture===!1&&(Sn.y*=-1,Sn.z*=-1),r.envMapRotation.value.setFromMatrix4(pu.makeRotationFromEuler(Sn)),r.flipEnvMap.value=l.isCubeTexture&&l.isRenderTargetTexture===!1?-1:1,r.reflectivity.value=a.reflectivity,r.ior.value=a.ior,r.refractionRatio.value=a.refractionRatio),a.lightMap&&(r.lightMap.value=a.lightMap,r.lightMapIntensity.value=a.lightMapIntensity,t(a.lightMap,r.lightMapTransform)),a.aoMap&&(r.aoMap.value=a.aoMap,r.aoMapIntensity.value=a.aoMapIntensity,t(a.aoMap,r.aoMapTransform))}return{refreshFogUniforms:function(r,a){a.color.getRGB(r.fogColor.value,Ls(i)),a.isFog?(r.fogNear.value=a.near,r.fogFar.value=a.far):a.isFogExp2&&(r.fogDensity.value=a.density)},refreshMaterialUniforms:function(r,a,s,l,o){a.isMeshBasicMaterial||a.isMeshLambertMaterial?n(r,a):a.isMeshToonMaterial?(n(r,a),(function(c,u){u.gradientMap&&(c.gradientMap.value=u.gradientMap)})(r,a)):a.isMeshPhongMaterial?(n(r,a),(function(c,u){c.specular.value.copy(u.specular),c.shininess.value=Math.max(u.shininess,1e-4)})(r,a)):a.isMeshStandardMaterial?(n(r,a),(function(c,u){c.metalness.value=u.metalness,u.metalnessMap&&(c.metalnessMap.value=u.metalnessMap,t(u.metalnessMap,c.metalnessMapTransform)),c.roughness.value=u.roughness,u.roughnessMap&&(c.roughnessMap.value=u.roughnessMap,t(u.roughnessMap,c.roughnessMapTransform)),u.envMap&&(c.envMapIntensity.value=u.envMapIntensity)})(r,a),a.isMeshPhysicalMaterial&&(function(c,u,d){c.ior.value=u.ior,u.sheen>0&&(c.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),c.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(c.sheenColorMap.value=u.sheenColorMap,t(u.sheenColorMap,c.sheenColorMapTransform)),u.sheenRoughnessMap&&(c.sheenRoughnessMap.value=u.sheenRoughnessMap,t(u.sheenRoughnessMap,c.sheenRoughnessMapTransform))),u.clearcoat>0&&(c.clearcoat.value=u.clearcoat,c.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(c.clearcoatMap.value=u.clearcoatMap,t(u.clearcoatMap,c.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(c.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,t(u.clearcoatRoughnessMap,c.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(c.clearcoatNormalMap.value=u.clearcoatNormalMap,t(u.clearcoatNormalMap,c.clearcoatNormalMapTransform),c.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===1&&c.clearcoatNormalScale.value.negate())),u.dispersion>0&&(c.dispersion.value=u.dispersion),u.iridescence>0&&(c.iridescence.value=u.iridescence,c.iridescenceIOR.value=u.iridescenceIOR,c.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],c.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(c.iridescenceMap.value=u.iridescenceMap,t(u.iridescenceMap,c.iridescenceMapTransform)),u.iridescenceThicknessMap&&(c.iridescenceThicknessMap.value=u.iridescenceThicknessMap,t(u.iridescenceThicknessMap,c.iridescenceThicknessMapTransform))),u.transmission>0&&(c.transmission.value=u.transmission,c.transmissionSamplerMap.value=d.texture,c.transmissionSamplerSize.value.set(d.width,d.height),u.transmissionMap&&(c.transmissionMap.value=u.transmissionMap,t(u.transmissionMap,c.transmissionMapTransform)),c.thickness.value=u.thickness,u.thicknessMap&&(c.thicknessMap.value=u.thicknessMap,t(u.thicknessMap,c.thicknessMapTransform)),c.attenuationDistance.value=u.attenuationDistance,c.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(c.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(c.anisotropyMap.value=u.anisotropyMap,t(u.anisotropyMap,c.anisotropyMapTransform))),c.specularIntensity.value=u.specularIntensity,c.specularColor.value.copy(u.specularColor),u.specularColorMap&&(c.specularColorMap.value=u.specularColorMap,t(u.specularColorMap,c.specularColorMapTransform)),u.specularIntensityMap&&(c.specularIntensityMap.value=u.specularIntensityMap,t(u.specularIntensityMap,c.specularIntensityMapTransform))})(r,a,o)):a.isMeshMatcapMaterial?(n(r,a),(function(c,u){u.matcap&&(c.matcap.value=u.matcap)})(r,a)):a.isMeshDepthMaterial?n(r,a):a.isMeshDistanceMaterial?(n(r,a),(function(c,u){const d=e.get(u).light;c.referencePosition.value.setFromMatrixPosition(d.matrixWorld),c.nearDistance.value=d.shadow.camera.near,c.farDistance.value=d.shadow.camera.far})(r,a)):a.isMeshNormalMaterial?n(r,a):a.isLineBasicMaterial?((function(c,u){c.diffuse.value.copy(u.color),c.opacity.value=u.opacity,u.map&&(c.map.value=u.map,t(u.map,c.mapTransform))})(r,a),a.isLineDashedMaterial&&(function(c,u){c.dashSize.value=u.dashSize,c.totalSize.value=u.dashSize+u.gapSize,c.scale.value=u.scale})(r,a)):a.isPointsMaterial?(function(c,u,d,h){c.diffuse.value.copy(u.color),c.opacity.value=u.opacity,c.size.value=u.size*d,c.scale.value=.5*h,u.map&&(c.map.value=u.map,t(u.map,c.uvTransform)),u.alphaMap&&(c.alphaMap.value=u.alphaMap,t(u.alphaMap,c.alphaMapTransform)),u.alphaTest>0&&(c.alphaTest.value=u.alphaTest)})(r,a,s,l):a.isSpriteMaterial?(function(c,u){c.diffuse.value.copy(u.color),c.opacity.value=u.opacity,c.rotation.value=u.rotation,u.map&&(c.map.value=u.map,t(u.map,c.mapTransform)),u.alphaMap&&(c.alphaMap.value=u.alphaMap,t(u.alphaMap,c.alphaMapTransform)),u.alphaTest>0&&(c.alphaTest.value=u.alphaTest)})(r,a):a.isShadowMaterial?(r.color.value.copy(a.color),r.opacity.value=a.opacity):a.isShaderMaterial&&(a.uniformsNeedUpdate=!1)}}}function gu(i,e,t,n){let r={},a={},s=[];const l=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function o(d,h,p,_){const x=d.value,f=h+"_"+p;if(_[f]===void 0)return _[f]=typeof x=="number"||typeof x=="boolean"?x:x.clone(),!0;{const m=_[f];if(typeof x=="number"||typeof x=="boolean"){if(m!==x)return _[f]=x,!0}else if(m.equals(x)===!1)return m.copy(x),!0}return!1}function c(d){const h={boundary:0,storage:0};return typeof d=="number"||typeof d=="boolean"?(h.boundary=4,h.storage=4):d.isVector2?(h.boundary=8,h.storage=8):d.isVector3||d.isColor?(h.boundary=16,h.storage=12):d.isVector4?(h.boundary=16,h.storage=16):d.isMatrix3?(h.boundary=48,h.storage=48):d.isMatrix4?(h.boundary=64,h.storage=64):d.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",d),h}function u(d){const h=d.target;h.removeEventListener("dispose",u);const p=s.indexOf(h.__bindingPointIndex);s.splice(p,1),i.deleteBuffer(r[h.id]),delete r[h.id],delete a[h.id]}return{bind:function(d,h){const p=h.program;n.uniformBlockBinding(d,p)},update:function(d,h){let p=r[d.id];p===void 0&&((function(f){const m=f.uniforms;let g=0;const v=16;for(let O=0,C=m.length;O<C;O++){const B=Array.isArray(m[O])?m[O]:[m[O]];for(let F=0,D=B.length;F<D;F++){const W=B[F],j=Array.isArray(W.value)?W.value:[W.value];for(let G=0,Y=j.length;G<Y;G++){const H=c(j[G]),$=g%v,K=$%H.boundary,ie=$+K;g+=K,ie!==0&&v-ie<H.storage&&(g+=v-ie),W.__data=new Float32Array(H.storage/Float32Array.BYTES_PER_ELEMENT),W.__offset=g,g+=H.storage}}}const T=g%v;T>0&&(g+=v-T),f.__size=g,f.__cache={}})(d),p=(function(f){const m=(function(){for(let O=0;O<l;O++)if(s.indexOf(O)===-1)return s.push(O),O;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0})();f.__bindingPointIndex=m;const g=i.createBuffer(),v=f.__size,T=f.usage;return i.bindBuffer(i.UNIFORM_BUFFER,g),i.bufferData(i.UNIFORM_BUFFER,v,T),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,m,g),g})(d),r[d.id]=p,d.addEventListener("dispose",u));const _=h.program;n.updateUBOMapping(d,_);const x=e.render.frame;a[d.id]!==x&&((function(f){const m=r[f.id],g=f.uniforms,v=f.__cache;i.bindBuffer(i.UNIFORM_BUFFER,m);for(let T=0,O=g.length;T<O;T++){const C=Array.isArray(g[T])?g[T]:[g[T]];for(let B=0,F=C.length;B<F;B++){const D=C[B];if(o(D,T,B,v)===!0){const W=D.__offset,j=Array.isArray(D.value)?D.value:[D.value];let G=0;for(let Y=0;Y<j.length;Y++){const H=j[Y],$=c(H);typeof H=="number"||typeof H=="boolean"?(D.__data[0]=H,i.bufferSubData(i.UNIFORM_BUFFER,W+G,D.__data)):H.isMatrix3?(D.__data[0]=H.elements[0],D.__data[1]=H.elements[1],D.__data[2]=H.elements[2],D.__data[3]=0,D.__data[4]=H.elements[3],D.__data[5]=H.elements[4],D.__data[6]=H.elements[5],D.__data[7]=0,D.__data[8]=H.elements[6],D.__data[9]=H.elements[7],D.__data[10]=H.elements[8],D.__data[11]=0):(H.toArray(D.__data,G),G+=$.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,W,D.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)})(d),a[d.id]=x)},dispose:function(){for(const d in r)i.deleteBuffer(r[d]);s=[],r={},a={}}}}class _u{constructor(e={}){const{canvas:t=ul(),context:n=null,depth:r=!0,stencil:a=!1,alpha:s=!1,antialias:l=!1,premultipliedAlpha:o=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reverseDepthBuffer:h=!1}=e;let p;if(this.isWebGLRenderer=!0,n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=s;const _=new Uint32Array(4),x=new Int32Array(4);let f=null,m=null;const g=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=ut,this.toneMapping=0,this.toneMappingExposure=1;const T=this;let O=!1,C=0,B=0,F=null,D=-1,W=null;const j=new qe,G=new qe;let Y=null;const H=new Fe(0);let $=0,K=t.width,ie=t.height,ne=1,fe=null,ve=null;const ee=new qe(0,0,K,ie),te=new qe(0,0,K,ie);let oe=!1;const me=new ba;let ce=!1,S=!1;const E=new Ae,R=new Ae,X=new b,P=new qe,V={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let y=!1;function U(){return F===null?ne:1}let z,ae,N,Z,J,Q,ue,he,ge,Se,Le,Pe,_e,Ie,ze,Ve,pe,Re,He,nn,rn,ct,pt,wt,L=n;function En(M,I){return t.getContext(M,I)}try{const M={alpha:!0,depth:r,stencil:a,antialias:l,premultipliedAlpha:o,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${_r}`),t.addEventListener("webglcontextlost",dr,!1),t.addEventListener("webglcontextrestored",fr,!1),t.addEventListener("webglcontextcreationerror",Dt,!1),L===null){const I="webgl2";if(L=En(I,M),L===null)throw En(I)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}function Qn(){z=new Gl(L),z.init(),ct=new cu(L,z),ae=new Ol(L,z,e,ct),N=new ou(L,z),ae.reverseDepthBuffer&&h&&N.buffers.depth.setReversed(!0),Z=new Wl(L),J=new Kc,Q=new lu(L,z,N,J,ae,ct,Z),ue=new Bl(T),he=new Hl(T),ge=new Ll(L),pt=new Il(L,ge),Se=new Vl(L,ge,Z,pt),Le=new ql(L,Se,ge,Z),He=new Xl(L,ae,Q),Ve=new Fl(J),Pe=new Yc(T,ue,he,z,ae,pt,Ve),_e=new mu(T,J),Ie=new Jc,ze=new nu(z),Re=new Dl(T,ue,he,N,Le,p,o),pe=new au(T,Le,ae),wt=new gu(L,Z,ae,N),nn=new Nl(L,z,Z),rn=new kl(L,z,Z),Z.programs=Pe.programs,T.capabilities=ae,T.extensions=z,T.properties=J,T.renderLists=Ie,T.shadowMap=pe,T.state=N,T.info=Z}Qn();const Ke=new fu(T,L);function dr(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),O=!0}function fr(){console.log("THREE.WebGLRenderer: Context Restored."),O=!1;const M=Z.autoReset,I=pe.enabled,k=pe.autoUpdate,w=pe.needsUpdate,A=pe.type;Qn(),Z.autoReset=M,pe.enabled=I,pe.autoUpdate=k,pe.needsUpdate=w,pe.type=A}function Dt(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function xi(M){const I=M.target;I.removeEventListener("dispose",xi),(function(k){(function(w){const A=J.get(w).programs;A!==void 0&&(A.forEach((function(q){Pe.releaseProgram(q)})),w.isShaderMaterial&&Pe.releaseShaderCache(w))})(k),J.remove(k)})(I)}function pr(M,I,k){M.transparent===!0&&M.side===2&&M.forceSinglePass===!1?(M.side=1,M.needsUpdate=!0,$e(M,I,k),M.side=0,M.needsUpdate=!0,$e(M,I,k),M.side=2):$e(M,I,k)}this.xr=Ke,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){const M=z.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=z.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return ne},this.setPixelRatio=function(M){M!==void 0&&(ne=M,this.setSize(K,ie,!1))},this.getSize=function(M){return M.set(K,ie)},this.setSize=function(M,I,k=!0){Ke.isPresenting?console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting."):(K=M,ie=I,t.width=Math.floor(M*ne),t.height=Math.floor(I*ne),k===!0&&(t.style.width=M+"px",t.style.height=I+"px"),this.setViewport(0,0,M,I))},this.getDrawingBufferSize=function(M){return M.set(K*ne,ie*ne).floor()},this.setDrawingBufferSize=function(M,I,k){K=M,ie=I,ne=k,t.width=Math.floor(M*k),t.height=Math.floor(I*k),this.setViewport(0,0,M,I)},this.getCurrentViewport=function(M){return M.copy(j)},this.getViewport=function(M){return M.copy(ee)},this.setViewport=function(M,I,k,w){M.isVector4?ee.set(M.x,M.y,M.z,M.w):ee.set(M,I,k,w),N.viewport(j.copy(ee).multiplyScalar(ne).round())},this.getScissor=function(M){return M.copy(te)},this.setScissor=function(M,I,k,w){M.isVector4?te.set(M.x,M.y,M.z,M.w):te.set(M,I,k,w),N.scissor(G.copy(te).multiplyScalar(ne).round())},this.getScissorTest=function(){return oe},this.setScissorTest=function(M){N.setScissorTest(oe=M)},this.setOpaqueSort=function(M){fe=M},this.setTransparentSort=function(M){ve=M},this.getClearColor=function(M){return M.copy(Re.getClearColor())},this.setClearColor=function(){Re.setClearColor.apply(Re,arguments)},this.getClearAlpha=function(){return Re.getClearAlpha()},this.setClearAlpha=function(){Re.setClearAlpha.apply(Re,arguments)},this.clear=function(M=!0,I=!0,k=!0){let w=0;if(M){let A=!1;if(F!==null){const q=F.texture.format;A=q===Pr||q===Cr||q===Rr}if(A){const q=F.texture.type,re=q===qt||q===un||q===ni||q===Cn||q===wr||q===Ar,le=Re.getClearColor(),de=Re.getClearAlpha(),xe=le.r,Te=le.g,Me=le.b;re?(_[0]=xe,_[1]=Te,_[2]=Me,_[3]=de,L.clearBufferuiv(L.COLOR,0,_)):(x[0]=xe,x[1]=Te,x[2]=Me,x[3]=de,L.clearBufferiv(L.COLOR,0,x))}else w|=L.COLOR_BUFFER_BIT}I&&(w|=L.DEPTH_BUFFER_BIT),k&&(w|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L.clear(w)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",dr,!1),t.removeEventListener("webglcontextrestored",fr,!1),t.removeEventListener("webglcontextcreationerror",Dt,!1),Ie.dispose(),ze.dispose(),J.dispose(),ue.dispose(),he.dispose(),Le.dispose(),pt.dispose(),wt.dispose(),Pe.dispose(),Ke.dispose(),Ke.removeEventListener("sessionstart",mr),Ke.removeEventListener("sessionend",Si),It.stop()},this.renderBufferDirect=function(M,I,k,w,A,q){I===null&&(I=V);const re=A.isMesh&&A.matrixWorld.determinant()<0,le=(function(De,lt,tt,Ce,Ee){lt.isScene!==!0&&(lt=V),Q.resetTextureUnits();const At=lt.fog,Ba=Ce.isMeshStandardMaterial?lt.environment:null,bi=F===null?T.outputColorSpace:F.isXRRenderTarget===!0?F.texture.colorSpace:Ln,ti=(Ce.isMeshStandardMaterial?he:ue).get(Ce.envMap||Ba),za=Ce.vertexColors===!0&&!!tt.attributes.color&&tt.attributes.color.itemSize===4,Ha=!!tt.attributes.tangent&&(!!Ce.normalMap||Ce.anisotropy>0),Ga=!!tt.morphAttributes.position,an=!!tt.morphAttributes.normal,Ku=!!tt.morphAttributes.color;let bo=0;Ce.toneMapped&&(F!==null&&F.isXRRenderTarget!==!0||(bo=T.toneMapping));const wo=tt.morphAttributes.position||tt.morphAttributes.normal||tt.morphAttributes.color,Zu=wo!==void 0?wo.length:0,Ue=J.get(Ce),Ju=m.state.lights;if(ce===!0&&(S===!0||De!==W)){const Mt=De===W&&Ce.id===D;Ve.setState(Ce,De,Mt)}let Rt=!1;Ce.version===Ue.__version?Ue.needsLights&&Ue.lightsStateVersion!==Ju.state.version||Ue.outputColorSpace!==bi||Ee.isBatchedMesh&&Ue.batching===!1?Rt=!0:Ee.isBatchedMesh||Ue.batching!==!0?Ee.isBatchedMesh&&Ue.batchingColor===!0&&Ee.colorTexture===null||Ee.isBatchedMesh&&Ue.batchingColor===!1&&Ee.colorTexture!==null||Ee.isInstancedMesh&&Ue.instancing===!1?Rt=!0:Ee.isInstancedMesh||Ue.instancing!==!0?Ee.isSkinnedMesh&&Ue.skinning===!1?Rt=!0:Ee.isSkinnedMesh||Ue.skinning!==!0?Ee.isInstancedMesh&&Ue.instancingColor===!0&&Ee.instanceColor===null||Ee.isInstancedMesh&&Ue.instancingColor===!1&&Ee.instanceColor!==null||Ee.isInstancedMesh&&Ue.instancingMorph===!0&&Ee.morphTexture===null||Ee.isInstancedMesh&&Ue.instancingMorph===!1&&Ee.morphTexture!==null||Ue.envMap!==ti||Ce.fog===!0&&Ue.fog!==At?Rt=!0:Ue.numClippingPlanes===void 0||Ue.numClippingPlanes===Ve.numPlanes&&Ue.numIntersection===Ve.numIntersection?(Ue.vertexAlphas!==za||Ue.vertexTangents!==Ha||Ue.morphTargets!==Ga||Ue.morphNormals!==an||Ue.morphColors!==Ku||Ue.toneMapping!==bo||Ue.morphTargetsCount!==Zu)&&(Rt=!0):Rt=!0:Rt=!0:Rt=!0:Rt=!0:(Rt=!0,Ue.__version=Ce.version);let Tn=Ue.currentProgram;Rt===!0&&(Tn=$e(Ce,lt,Ee));let Ao=!1,wi=!1,Va=!1;const je=Tn.getUniforms(),sn=Ue.uniforms;if(N.useProgram(Tn.program)&&(Ao=!0,wi=!0,Va=!0),Ce.id!==D&&(D=Ce.id,wi=!0),Ao||W!==De){N.buffers.depth.getReversed()?(E.copy(De.projectionMatrix),(function(bn){const Xe=bn.elements;Xe[2]=.5*Xe[2]+.5*Xe[3],Xe[6]=.5*Xe[6]+.5*Xe[7],Xe[10]=.5*Xe[10]+.5*Xe[11],Xe[14]=.5*Xe[14]+.5*Xe[15]})(E),(function(bn){const Xe=bn.elements;Xe[11]===-1?(Xe[10]=-Xe[10]-1,Xe[14]=-Xe[14]):(Xe[10]=-Xe[10],Xe[14]=1-Xe[14])})(E),je.setValue(L,"projectionMatrix",E)):je.setValue(L,"projectionMatrix",De.projectionMatrix),je.setValue(L,"viewMatrix",De.matrixWorldInverse);const Mt=je.map.cameraPosition;Mt!==void 0&&Mt.setValue(L,X.setFromMatrixPosition(De.matrixWorld)),ae.logarithmicDepthBuffer&&je.setValue(L,"logDepthBufFC",2/(Math.log(De.far+1)/Math.LN2)),(Ce.isMeshPhongMaterial||Ce.isMeshToonMaterial||Ce.isMeshLambertMaterial||Ce.isMeshBasicMaterial||Ce.isMeshStandardMaterial||Ce.isShaderMaterial)&&je.setValue(L,"isOrthographic",De.isOrthographicCamera===!0),W!==De&&(W=De,wi=!0,Va=!0)}if(Ee.isSkinnedMesh){je.setOptional(L,Ee,"bindMatrix"),je.setOptional(L,Ee,"bindMatrixInverse");const Mt=Ee.skeleton;Mt&&(Mt.boneTexture===null&&Mt.computeBoneTexture(),je.setValue(L,"boneTexture",Mt.boneTexture,Q))}Ee.isBatchedMesh&&(je.setOptional(L,Ee,"batchingTexture"),je.setValue(L,"batchingTexture",Ee._matricesTexture,Q),je.setOptional(L,Ee,"batchingIdTexture"),je.setValue(L,"batchingIdTexture",Ee._indirectTexture,Q),je.setOptional(L,Ee,"batchingColorTexture"),Ee._colorsTexture!==null&&je.setValue(L,"batchingColorTexture",Ee._colorsTexture,Q));const ka=tt.morphAttributes;ka.position===void 0&&ka.normal===void 0&&ka.color===void 0||He.update(Ee,tt,Tn),(wi||Ue.receiveShadow!==Ee.receiveShadow)&&(Ue.receiveShadow=Ee.receiveShadow,je.setValue(L,"receiveShadow",Ee.receiveShadow)),Ce.isMeshGouraudMaterial&&Ce.envMap!==null&&(sn.envMap.value=ti,sn.flipEnvMap.value=ti.isCubeTexture&&ti.isRenderTargetTexture===!1?-1:1),Ce.isMeshStandardMaterial&&Ce.envMap===null&&lt.environment!==null&&(sn.envMapIntensity.value=lt.environmentIntensity),wi&&(je.setValue(L,"toneMappingExposure",T.toneMappingExposure),Ue.needsLights&&(Ct=Va,(Nt=sn).ambientLightColor.needsUpdate=Ct,Nt.lightProbe.needsUpdate=Ct,Nt.directionalLights.needsUpdate=Ct,Nt.directionalLightShadows.needsUpdate=Ct,Nt.pointLights.needsUpdate=Ct,Nt.pointLightShadows.needsUpdate=Ct,Nt.spotLights.needsUpdate=Ct,Nt.spotLightShadows.needsUpdate=Ct,Nt.rectAreaLights.needsUpdate=Ct,Nt.hemisphereLights.needsUpdate=Ct),At&&Ce.fog===!0&&_e.refreshFogUniforms(sn,At),_e.refreshMaterialUniforms(sn,Ce,ne,ie,m.state.transmissionRenderTarget[De.id]),sr.upload(L,yi(Ue),sn,Q));var Nt,Ct;if(Ce.isShaderMaterial&&Ce.uniformsNeedUpdate===!0&&(sr.upload(L,yi(Ue),sn,Q),Ce.uniformsNeedUpdate=!1),Ce.isSpriteMaterial&&je.setValue(L,"center",Ee.center),je.setValue(L,"modelViewMatrix",Ee.modelViewMatrix),je.setValue(L,"normalMatrix",Ee.normalMatrix),je.setValue(L,"modelMatrix",Ee.matrixWorld),Ce.isShaderMaterial||Ce.isRawShaderMaterial){const Mt=Ce.uniformsGroups;for(let bn=0,Xe=Mt.length;bn<Xe;bn++){const Ro=Mt[bn];wt.update(Ro,Tn),wt.bind(Ro,Tn)}}return Tn})(M,I,k,w,A);N.setMaterial(w,re);let de=k.index,xe=1;if(w.wireframe===!0){if(de=Se.getWireframeAttribute(k),de===void 0)return;xe=2}const Te=k.drawRange,Me=k.attributes.position;let we=Te.start*xe,We=(Te.start+Te.count)*xe;q!==null&&(we=Math.max(we,q.start*xe),We=Math.min(We,(q.start+q.count)*xe)),de!==null?(we=Math.max(we,0),We=Math.min(We,de.count)):Me!=null&&(we=Math.max(we,0),We=Math.min(We,Me.count));const Be=We-we;if(Be<0||Be===1/0)return;let Qe;pt.setup(A,w,le,k,de);let ke=nn;if(de!==null&&(Qe=ge.get(de),ke=rn,ke.setIndex(Qe)),A.isMesh)w.wireframe===!0?(N.setLineWidth(w.wireframeLinewidth*U()),ke.setMode(L.LINES)):ke.setMode(L.TRIANGLES);else if(A.isLine){let De=w.linewidth;De===void 0&&(De=1),N.setLineWidth(De*U()),A.isLineSegments?ke.setMode(L.LINES):A.isLineLoop?ke.setMode(L.LINE_LOOP):ke.setMode(L.LINE_STRIP)}else A.isPoints?ke.setMode(L.POINTS):A.isSprite&&ke.setMode(L.TRIANGLES);if(A.isBatchedMesh)if(A._multiDrawInstances!==null)ke.renderMultiDrawInstances(A._multiDrawStarts,A._multiDrawCounts,A._multiDrawCount,A._multiDrawInstances);else if(z.get("WEBGL_multi_draw"))ke.renderMultiDraw(A._multiDrawStarts,A._multiDrawCounts,A._multiDrawCount);else{const De=A._multiDrawStarts,lt=A._multiDrawCounts,tt=A._multiDrawCount,Ce=de?ge.get(de).bytesPerElement:1,Ee=J.get(w).currentProgram.getUniforms();for(let At=0;At<tt;At++)Ee.setValue(L,"_gl_DrawID",At),ke.render(De[At]/Ce,lt[At])}else if(A.isInstancedMesh)ke.renderInstances(we,Be,A.count);else if(k.isInstancedBufferGeometry){const De=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,lt=Math.min(k.instanceCount,De);ke.renderInstances(we,Be,lt)}else ke.render(we,Be)},this.compile=function(M,I,k=null){k===null&&(k=M),m=ze.get(k),m.init(I),v.push(m),k.traverseVisible((function(A){A.isLight&&A.layers.test(I.layers)&&(m.pushLight(A),A.castShadow&&m.pushShadow(A))})),M!==k&&M.traverseVisible((function(A){A.isLight&&A.layers.test(I.layers)&&(m.pushLight(A),A.castShadow&&m.pushShadow(A))})),m.setupLights();const w=new Set;return M.traverse((function(A){if(!(A.isMesh||A.isPoints||A.isLine||A.isSprite))return;const q=A.material;if(q)if(Array.isArray(q))for(let re=0;re<q.length;re++){const le=q[re];pr(le,k,A),w.add(le)}else pr(q,k,A),w.add(q)})),v.pop(),m=null,w},this.compileAsync=function(M,I,k=null){const w=this.compile(M,I,k);return new Promise((A=>{function q(){w.forEach((function(re){J.get(re).currentProgram.isReady()&&w.delete(re)})),w.size!==0?setTimeout(q,10):A(M)}z.get("KHR_parallel_shader_compile")!==null?q():setTimeout(q,10)}))};let Mi=null;function mr(){It.stop()}function Si(){It.start()}const It=new Ns;function yn(M,I,k,w){if(M.visible===!1)return;if(M.layers.test(I.layers)){if(M.isGroup)k=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(I);else if(M.isLight)m.pushLight(M),M.castShadow&&m.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||me.intersectsSprite(M)){w&&P.setFromMatrixPosition(M.matrixWorld).applyMatrix4(R);const q=Le.update(M),re=M.material;re.visible&&f.push(M,q,re,k,P.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||me.intersectsObject(M))){const q=Le.update(M),re=M.material;if(w&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),P.copy(M.boundingSphere.center)):(q.boundingSphere===null&&q.computeBoundingSphere(),P.copy(q.boundingSphere.center)),P.applyMatrix4(M.matrixWorld).applyMatrix4(R)),Array.isArray(re)){const le=q.groups;for(let de=0,xe=le.length;de<xe;de++){const Te=le[de],Me=re[Te.materialIndex];Me&&Me.visible&&f.push(M,q,Me,k,P.z,Te)}}else re.visible&&f.push(M,q,re,k,P.z,null)}}const A=M.children;for(let q=0,re=A.length;q<re;q++)yn(A[q],I,k,w)}function gr(M,I,k,w){const A=M.opaque,q=M.transmissive,re=M.transparent;m.setupLightsView(k),ce===!0&&Ve.setGlobalState(T.clippingPlanes,k),w&&N.viewport(j.copy(w)),A.length>0&&ei(A,I,k),q.length>0&&ei(q,I,k),re.length>0&&ei(re,I,k),N.buffers.depth.setTest(!0),N.buffers.depth.setMask(!0),N.buffers.color.setMask(!0),N.setPolygonOffset(!1)}function Ei(M,I,k,w){if((k.isScene===!0?k.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[w.id]===void 0&&(m.state.transmissionRenderTarget[w.id]=new dn(1,1,{generateMipmaps:!0,type:z.has("EXT_color_buffer_half_float")||z.has("EXT_color_buffer_float")?ii:qt,minFilter:cn,samples:4,stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Ne.workingColorSpace}));const A=m.state.transmissionRenderTarget[w.id],q=w.viewport||j;A.setSize(q.z,q.w);const re=T.getRenderTarget();T.setRenderTarget(A),T.getClearColor(H),$=T.getClearAlpha(),$<1&&T.setClearColor(16777215,.5),T.clear(),y&&Re.render(k);const le=T.toneMapping;T.toneMapping=0;const de=w.viewport;if(w.viewport!==void 0&&(w.viewport=void 0),m.setupLightsView(w),ce===!0&&Ve.setGlobalState(T.clippingPlanes,w),ei(M,k,w),Q.updateMultisampleRenderTarget(A),Q.updateRenderTargetMipmap(A),z.has("WEBGL_multisampled_render_to_texture")===!1){let xe=!1;for(let Te=0,Me=I.length;Te<Me;Te++){const we=I[Te],We=we.object,Be=we.geometry,Qe=we.material,ke=we.group;if(Qe.side===2&&We.layers.test(w.layers)){const De=Qe.side;Qe.side=1,Qe.needsUpdate=!0,xt(We,k,w,Be,Qe,ke),Qe.side=De,Qe.needsUpdate=!0,xe=!0}}xe===!0&&(Q.updateMultisampleRenderTarget(A),Q.updateRenderTargetMipmap(A))}T.setRenderTarget(re),T.setClearColor(H,$),de!==void 0&&(w.viewport=de),T.toneMapping=le}function ei(M,I,k){const w=I.isScene===!0?I.overrideMaterial:null;for(let A=0,q=M.length;A<q;A++){const re=M[A],le=re.object,de=re.geometry,xe=w===null?re.material:w,Te=re.group;le.layers.test(k.layers)&&xt(le,I,k,de,xe,Te)}}function xt(M,I,k,w,A,q){M.onBeforeRender(T,I,k,w,A,q),M.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),A.onBeforeRender(T,I,k,w,M,q),A.transparent===!0&&A.side===2&&A.forceSinglePass===!1?(A.side=1,A.needsUpdate=!0,T.renderBufferDirect(k,I,w,A,M,q),A.side=0,A.needsUpdate=!0,T.renderBufferDirect(k,I,w,A,M,q),A.side=2):T.renderBufferDirect(k,I,w,A,M,q),M.onAfterRender(T,I,k,w,A,q)}function $e(M,I,k){I.isScene!==!0&&(I=V);const w=J.get(M),A=m.state.lights,q=m.state.shadowsArray,re=A.state.version,le=Pe.getParameters(M,A.state,q,I,k),de=Pe.getProgramCacheKey(le);let xe=w.programs;w.environment=M.isMeshStandardMaterial?I.environment:null,w.fog=I.fog,w.envMap=(M.isMeshStandardMaterial?he:ue).get(M.envMap||w.environment),w.envMapRotation=w.environment!==null&&M.envMap===null?I.environmentRotation:M.envMapRotation,xe===void 0&&(M.addEventListener("dispose",xi),xe=new Map,w.programs=xe);let Te=xe.get(de);if(Te!==void 0){if(w.currentProgram===Te&&w.lightsStateVersion===re)return Ti(M,le),Te}else le.uniforms=Pe.getUniforms(M),M.onBeforeCompile(le,T),Te=Pe.acquireProgram(le,de),xe.set(de,Te),w.uniforms=le.uniforms;const Me=w.uniforms;return(M.isShaderMaterial||M.isRawShaderMaterial)&&M.clipping!==!0||(Me.clippingPlanes=Ve.uniform),Ti(M,le),w.needsLights=(function(we){return we.isMeshLambertMaterial||we.isMeshToonMaterial||we.isMeshPhongMaterial||we.isMeshStandardMaterial||we.isShadowMaterial||we.isShaderMaterial&&we.lights===!0})(M),w.lightsStateVersion=re,w.needsLights&&(Me.ambientLightColor.value=A.state.ambient,Me.lightProbe.value=A.state.probe,Me.directionalLights.value=A.state.directional,Me.directionalLightShadows.value=A.state.directionalShadow,Me.spotLights.value=A.state.spot,Me.spotLightShadows.value=A.state.spotShadow,Me.rectAreaLights.value=A.state.rectArea,Me.ltc_1.value=A.state.rectAreaLTC1,Me.ltc_2.value=A.state.rectAreaLTC2,Me.pointLights.value=A.state.point,Me.pointLightShadows.value=A.state.pointShadow,Me.hemisphereLights.value=A.state.hemi,Me.directionalShadowMap.value=A.state.directionalShadowMap,Me.directionalShadowMatrix.value=A.state.directionalShadowMatrix,Me.spotShadowMap.value=A.state.spotShadowMap,Me.spotLightMatrix.value=A.state.spotLightMatrix,Me.spotLightMap.value=A.state.spotLightMap,Me.pointShadowMap.value=A.state.pointShadowMap,Me.pointShadowMatrix.value=A.state.pointShadowMatrix),w.currentProgram=Te,w.uniformsList=null,Te}function yi(M){if(M.uniformsList===null){const I=M.currentProgram.getUniforms();M.uniformsList=sr.seqWithValue(I.seq,M.uniforms)}return M.uniformsList}function Ti(M,I){const k=J.get(M);k.outputColorSpace=I.outputColorSpace,k.batching=I.batching,k.batchingColor=I.batchingColor,k.instancing=I.instancing,k.instancingColor=I.instancingColor,k.instancingMorph=I.instancingMorph,k.skinning=I.skinning,k.morphTargets=I.morphTargets,k.morphNormals=I.morphNormals,k.morphColors=I.morphColors,k.morphTargetsCount=I.morphTargetsCount,k.numClippingPlanes=I.numClippingPlanes,k.numIntersection=I.numClipIntersection,k.vertexAlphas=I.vertexAlphas,k.vertexTangents=I.vertexTangents,k.toneMapping=I.toneMapping}It.setAnimationLoop((function(M){Mi&&Mi(M)})),typeof self<"u"&&It.setContext(self),this.setAnimationLoop=function(M){Mi=M,Ke.setAnimationLoop(M),M===null?It.stop():It.start()},Ke.addEventListener("sessionstart",mr),Ke.addEventListener("sessionend",Si),this.render=function(M,I){if(I!==void 0&&I.isCamera!==!0)return void console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");if(O===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),Ke.enabled===!0&&Ke.isPresenting===!0&&(Ke.cameraAutoUpdate===!0&&Ke.updateCamera(I),I=Ke.getCamera()),M.isScene===!0&&M.onBeforeRender(T,M,I,F),m=ze.get(M,v.length),m.init(I),v.push(m),R.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),me.setFromProjectionMatrix(R),S=this.localClippingEnabled,ce=Ve.init(this.clippingPlanes,S),f=Ie.get(M,g.length),f.init(),g.push(f),Ke.enabled===!0&&Ke.isPresenting===!0){const q=T.xr.getDepthSensingMesh();q!==null&&yn(q,I,-1/0,T.sortObjects)}yn(M,I,0,T.sortObjects),f.finish(),T.sortObjects===!0&&f.sort(fe,ve),y=Ke.enabled===!1||Ke.isPresenting===!1||Ke.hasDepthSensing()===!1,y&&Re.addToRenderList(f,M),this.info.render.frame++,ce===!0&&Ve.beginShadows();const k=m.state.shadowsArray;pe.render(k,M,I),ce===!0&&Ve.endShadows(),this.info.autoReset===!0&&this.info.reset();const w=f.opaque,A=f.transmissive;if(m.setupLights(),I.isArrayCamera){const q=I.cameras;if(A.length>0)for(let re=0,le=q.length;re<le;re++)Ei(w,A,M,q[re]);y&&Re.render(M);for(let re=0,le=q.length;re<le;re++){const de=q[re];gr(f,M,de,de.viewport)}}else A.length>0&&Ei(w,A,M,I),y&&Re.render(M),gr(f,M,I);F!==null&&(Q.updateMultisampleRenderTarget(F),Q.updateRenderTargetMipmap(F)),M.isScene===!0&&M.onAfterRender(T,M,I),pt.resetDefaultState(),D=-1,W=null,v.pop(),v.length>0?(m=v[v.length-1],ce===!0&&Ve.setGlobalState(T.clippingPlanes,m.state.camera)):m=null,g.pop(),f=g.length>0?g[g.length-1]:null},this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return B},this.getRenderTarget=function(){return F},this.setRenderTargetTextures=function(M,I,k){J.get(M.texture).__webglTexture=I,J.get(M.depthTexture).__webglTexture=k;const w=J.get(M);w.__hasExternalTextures=!0,w.__autoAllocateDepthBuffer=k===void 0,w.__autoAllocateDepthBuffer||z.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),w.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(M,I){const k=J.get(M);k.__webglFramebuffer=I,k.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(M,I=0,k=0){F=M,C=I,B=k;let w=!0,A=null,q=!1,re=!1;if(M){const le=J.get(M);if(le.__useDefaultFramebuffer!==void 0)N.bindFramebuffer(L.FRAMEBUFFER,null),w=!1;else if(le.__webglFramebuffer===void 0)Q.setupRenderTarget(M);else if(le.__hasExternalTextures)Q.rebindTextures(M,J.get(M.texture).__webglTexture,J.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Te=M.depthTexture;if(le.__boundDepthTexture!==Te){if(Te!==null&&J.has(Te)&&(M.width!==Te.image.width||M.height!==Te.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Q.setupDepthRenderbuffer(M)}}const de=M.texture;(de.isData3DTexture||de.isDataArrayTexture||de.isCompressedArrayTexture)&&(re=!0);const xe=J.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(A=Array.isArray(xe[I])?xe[I][k]:xe[I],q=!0):A=M.samples>0&&Q.useMultisampledRTT(M)===!1?J.get(M).__webglMultisampledFramebuffer:Array.isArray(xe)?xe[k]:xe,j.copy(M.viewport),G.copy(M.scissor),Y=M.scissorTest}else j.copy(ee).multiplyScalar(ne).floor(),G.copy(te).multiplyScalar(ne).floor(),Y=oe;if(N.bindFramebuffer(L.FRAMEBUFFER,A)&&w&&N.drawBuffers(M,A),N.viewport(j),N.scissor(G),N.setScissorTest(Y),q){const le=J.get(M.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+I,le.__webglTexture,k)}else if(re){const le=J.get(M.texture),de=I||0;L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,le.__webglTexture,k||0,de)}D=-1},this.readRenderTargetPixels=function(M,I,k,w,A,q,re){if(!M||!M.isWebGLRenderTarget)return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let le=J.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&re!==void 0&&(le=le[re]),le){N.bindFramebuffer(L.FRAMEBUFFER,le);try{const de=M.texture,xe=de.format,Te=de.type;if(!ae.textureFormatReadable(xe))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");if(!ae.textureTypeReadable(Te))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");I>=0&&I<=M.width-w&&k>=0&&k<=M.height-A&&L.readPixels(I,k,w,A,ct.convert(xe),ct.convert(Te),q)}finally{const de=F!==null?J.get(F).__webglFramebuffer:null;N.bindFramebuffer(L.FRAMEBUFFER,de)}}},this.readRenderTargetPixelsAsync=async function(M,I,k,w,A,q,re){if(!M||!M.isWebGLRenderTarget)throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let le=J.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&re!==void 0&&(le=le[re]),le){const de=M.texture,xe=de.format,Te=de.type;if(!ae.textureFormatReadable(xe))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!ae.textureTypeReadable(Te))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(I>=0&&I<=M.width-w&&k>=0&&k<=M.height-A){N.bindFramebuffer(L.FRAMEBUFFER,le);const Me=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,Me),L.bufferData(L.PIXEL_PACK_BUFFER,q.byteLength,L.STREAM_READ),L.readPixels(I,k,w,A,ct.convert(xe),ct.convert(Te),0);const we=F!==null?J.get(F).__webglFramebuffer:null;N.bindFramebuffer(L.FRAMEBUFFER,we);const We=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await(function(Be,Qe,ke){return new Promise((function(De,lt){setTimeout((function tt(){switch(Be.clientWaitSync(Qe,Be.SYNC_FLUSH_COMMANDS_BIT,0)){case Be.WAIT_FAILED:lt();break;case Be.TIMEOUT_EXPIRED:setTimeout(tt,ke);break;default:De()}}),ke)}))})(L,We,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,Me),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,q),L.deleteBuffer(Me),L.deleteSync(We),q}throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(M,I=null,k=0){M.isTexture!==!0&&(li("WebGLRenderer: copyFramebufferToTexture function signature has changed."),I=arguments[0]||null,M=arguments[1]);const w=Math.pow(2,-k),A=Math.floor(M.image.width*w),q=Math.floor(M.image.height*w),re=I!==null?I.x:0,le=I!==null?I.y:0;Q.setTexture2D(M,0),L.copyTexSubImage2D(L.TEXTURE_2D,k,0,0,re,le,A,q),N.unbindTexture()},this.copyTextureToTexture=function(M,I,k=null,w=null,A=0){let q,re,le,de,xe,Te,Me,we,We;M.isTexture!==!0&&(li("WebGLRenderer: copyTextureToTexture function signature has changed."),w=arguments[0]||null,M=arguments[1],I=arguments[2],A=arguments[3]||0,k=null);const Be=M.isCompressedTexture?M.mipmaps[A]:M.image;k!==null?(q=k.max.x-k.min.x,re=k.max.y-k.min.y,le=k.isBox3?k.max.z-k.min.z:1,de=k.min.x,xe=k.min.y,Te=k.isBox3?k.min.z:0):(q=Be.width,re=Be.height,le=Be.depth||1,de=0,xe=0,Te=0),w!==null?(Me=w.x,we=w.y,We=w.z):(Me=0,we=0,We=0);const Qe=ct.convert(I.format),ke=ct.convert(I.type);let De;I.isData3DTexture?(Q.setTexture3D(I,0),De=L.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(Q.setTexture2DArray(I,0),De=L.TEXTURE_2D_ARRAY):(Q.setTexture2D(I,0),De=L.TEXTURE_2D),L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,I.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,I.unpackAlignment);const lt=L.getParameter(L.UNPACK_ROW_LENGTH),tt=L.getParameter(L.UNPACK_IMAGE_HEIGHT),Ce=L.getParameter(L.UNPACK_SKIP_PIXELS),Ee=L.getParameter(L.UNPACK_SKIP_ROWS),At=L.getParameter(L.UNPACK_SKIP_IMAGES);L.pixelStorei(L.UNPACK_ROW_LENGTH,Be.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,Be.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,de),L.pixelStorei(L.UNPACK_SKIP_ROWS,xe),L.pixelStorei(L.UNPACK_SKIP_IMAGES,Te);const Ba=M.isDataArrayTexture||M.isData3DTexture,bi=I.isDataArrayTexture||I.isData3DTexture;if(M.isRenderTargetTexture||M.isDepthTexture){const ti=J.get(M),za=J.get(I),Ha=J.get(ti.__renderTarget),Ga=J.get(za.__renderTarget);N.bindFramebuffer(L.READ_FRAMEBUFFER,Ha.__webglFramebuffer),N.bindFramebuffer(L.DRAW_FRAMEBUFFER,Ga.__webglFramebuffer);for(let an=0;an<le;an++)Ba&&L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,J.get(M).__webglTexture,A,Te+an),M.isDepthTexture?(bi&&L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,J.get(I).__webglTexture,A,We+an),L.blitFramebuffer(de,xe,q,re,Me,we,q,re,L.DEPTH_BUFFER_BIT,L.NEAREST)):bi?L.copyTexSubImage3D(De,A,Me,we,We+an,de,xe,q,re):L.copyTexSubImage2D(De,A,Me,we,We+an,de,xe,q,re);N.bindFramebuffer(L.READ_FRAMEBUFFER,null),N.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else bi?M.isDataTexture||M.isData3DTexture?L.texSubImage3D(De,A,Me,we,We,q,re,le,Qe,ke,Be.data):I.isCompressedArrayTexture?L.compressedTexSubImage3D(De,A,Me,we,We,q,re,le,Qe,Be.data):L.texSubImage3D(De,A,Me,we,We,q,re,le,Qe,ke,Be):M.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,A,Me,we,q,re,Qe,ke,Be.data):M.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,A,Me,we,Be.width,Be.height,Qe,Be.data):L.texSubImage2D(L.TEXTURE_2D,A,Me,we,q,re,Qe,ke,Be);L.pixelStorei(L.UNPACK_ROW_LENGTH,lt),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,tt),L.pixelStorei(L.UNPACK_SKIP_PIXELS,Ce),L.pixelStorei(L.UNPACK_SKIP_ROWS,Ee),L.pixelStorei(L.UNPACK_SKIP_IMAGES,At),A===0&&I.generateMipmaps&&L.generateMipmap(De),N.unbindTexture()},this.copyTextureToTexture3D=function(M,I,k=null,w=null,A=0){return M.isTexture!==!0&&(li("WebGLRenderer: copyTextureToTexture3D function signature has changed."),k=arguments[0]||null,w=arguments[1]||null,M=arguments[2],I=arguments[3],A=arguments[4]||0),li('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(M,I,k,w,A)},this.initRenderTarget=function(M){J.get(M).__webglFramebuffer===void 0&&Q.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?Q.setTextureCube(M,0):M.isData3DTexture?Q.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?Q.setTexture2DArray(M,0):Q.setTexture2D(M,0),N.unbindTexture()},this.resetState=function(){C=0,B=0,F=null,N.reset(),pt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Dn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorspace=Ne._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ne._getUnpackColorSpace()}}class vu extends dt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Gt,this.environmentIntensity=1,this.environmentRotation=new Gt,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}new b,new b,new b,new b,new Oe,new Oe,new Ae,new b,new b,new b,new Oe,new Oe,new Oe,new b,new b,new b,new qe,new qe,new b,new Ae,new b,new zt,new Ae,new ki,new Ae,new Ae;class _i extends bt{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}new Ae,new Ae,new Yt,new Ae,new _t,new zt,new Ae,new Fe(1,1,1),new ba,new Yt,new zt,new b,new b,new b,new _t,new b,new b,new Ae,new ki,new zt,new b,new b,new b,new b,new Ae,new ki,new zt,new b;class xu extends st{constructor(e,t,n,r,a,s,l,o,c){super(e,t,n,r,a,s,l,o,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}new b,new b,new b,new b,new mt,new Ae,new b,new b,new Ae,new b,new b;class Mu extends en{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}new Ae,new Ae,new Ae,new b,new b,new b,new b,new b,new b;const fo="\\[\\]\\.:\\/",Na="[^"+fo+"]",Su="[^"+fo.replace("\\.","")+"]";new RegExp("^"+/((?:WC+[\/:])*)/.source.replace("WC",Na)+/(WCOD+)?/.source.replace("WCOD",Su)+/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Na)+/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Na)+"$"),new Ae,new Oe,new b,new b,new b,new b,new Ae,new Ae,new b,new Fe,new Fe,new b,new b,new b,new b,new ya,new Yt,new b,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:_r}})),typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=_r);const vi=16;function Eu(i,e){const t=yu(i.length,e.aspect,e.cellHeight,e.maxSize),n=document.createElement("canvas");n.width=t.columns*t.cellW,n.height=t.rows*t.cellH;const r=n.getContext("2d",{alpha:!1});if(!r)throw new Error("Could not create the card atlas.");r.imageSmoothingEnabled=!0,r.imageSmoothingQuality="high";const a=i.map((l,o)=>Tu(o,t,n));for(const l of i)Oa(r,t,l,null,e);let s=!1;return{canvas:n,rects:a,destroy(){s=!0,n.width=1,n.height=1},clear(){if(!s)for(const l of i)Oa(r,t,l,null,e)},load(l,{signal:o,onPaint:c}){const u=bu(i,l);let d=0;async function h(){var _,x;for(;d<u.length&&!s&&!(o!=null&&o.aborted);){const f=u[d];d+=1;try{const m=await wu(f.url,e.decodeWidth,o);if(s||o!=null&&o.aborted){(_=m.close)==null||_.call(m);return}for(const g of f.indexes)for(const v of i)v.image===g&&Oa(r,t,v,m,e);(x=m.close)==null||x.call(m),c==null||c()}catch(m){if((m==null?void 0:m.name)==="AbortError"||s)return}}}const p=Math.min(4,u.length);return p===0?Promise.resolve():Promise.all(Array.from({length:p},h)).then(()=>{})}}}function yu(i,e,t,n){let r=t,a=Math.max(1,Math.round(r*e)),s=a+vi*2,l=r+vi*2,o=Math.max(1,Math.floor(n/s)),c=Math.ceil(Math.max(1,i)/o);for(;(c*l>n||o*s>n)&&r>64;)r-=8,a=Math.max(1,Math.round(r*e)),s=a+vi*2,l=r+vi*2,o=Math.max(1,Math.floor(n/s)),c=Math.ceil(Math.max(1,i)/o);return{contentW:a,contentH:r,gutter:vi,cellW:s,cellH:l,columns:o,rows:c}}function po(i,e){const t=i%e.columns,n=Math.floor(i/e.columns);return{x:t*e.cellW,y:n*e.cellH,w:e.cellW,h:e.cellH}}function mo(i,e){const t=po(i,e);return{x:t.x+e.gutter,y:t.y+e.gutter,w:e.contentW,h:e.contentH}}function Tu(i,e,t){const n=mo(i,e),r=.5,a=(n.x+r)/t.width,s=(n.x+n.w-r)/t.width,l=1-(n.y+r)/t.height,o=1-(n.y+n.h-r)/t.height;return[a,o,s-a,l-o]}function Oa(i,e,t,n,r){const a=po(t.index,e),s=mo(t.index,e);if(i.fillStyle=t.color,i.fillRect(a.x,a.y,a.w,a.h),!n)return;const l=Math.round(Math.min(s.w,s.h)*r.imageInset),o=s.w-l*2,c=s.h-l*2;if(o<2||c<2)return;const u=Math.max(o/n.width,c/n.height),d=o/u,h=c/u,p=(n.width-d)*.5,_=(n.height-h)*.5,x=Math.min(o,c)*r.imageRadius;i.save(),Ru(i,s.x+l,s.y+l,o,c,x),i.clip(),i.drawImage(n,p,_,d,h,s.x+l,s.y+l,o,c),i.restore()}function bu(i,e){const t=new Map;for(const n of i){const r=n.image>=0?e[n.image]:"";if(!r)continue;let a=t.get(r);a||(a=[],t.set(r,a)),a.includes(n.image)||a.push(n.image)}return[...t.entries()].map(([n,r])=>({url:n,indexes:r}))}async function wu(i,e,t){const n=await fetch(i,{signal:t});if(!n.ok)throw new Error(`Failed to load ${i}`);const r=await n.blob();if(typeof createImageBitmap!="function")return Au(i);try{return await createImageBitmap(r,{resizeWidth:e,resizeQuality:"medium"})}catch{return await createImageBitmap(r)}}function Au(i){return new Promise((e,t)=>{const n=new Image;n.onload=()=>e(n),n.onerror=()=>t(new Error(`Failed to load ${i}`)),n.src=i})}function Ru(i,e,t,n,r,a){const s=Math.max(0,Math.min(a,n/2,r/2));if(i.beginPath(),typeof i.roundRect=="function"){i.roundRect(e,t,n,r,s);return}i.moveTo(e+s,t),i.arcTo(e+n,t,e+n,t+r,s),i.arcTo(e+n,t+r,e,t+r,s),i.arcTo(e,t+r,e,t,s),i.arcTo(e,t,e+n,t,s),i.closePath()}function Cu(){var i;return!!(window.matchMedia("(prefers-reduced-motion: reduce)").matches||!window.matchMedia("(hover: hover) and (pointer: fine)").matches||(i=navigator.connection)!=null&&i.saveData||!Pu())}function Fa(i){i.hasAttribute("aria-label")||i.setAttribute("aria-label","Globe of images.")}function Pu(){var i;try{const e=document.createElement("canvas"),t=e.getContext("webgl2")||e.getContext("webgl");return t?((i=t.getExtension("WEBGL_lose_context"))==null||i.loseContext(),!0):!1}catch{return!1}}const $n={colors:["#C7DBFF","#6A9CF8","#A7E6E4","#DEEB91","#E7F3C4"],backMix:.58,backWash:"#F7FBFF",rimMix:.2,background:"#F8FAFF",radius:1.4,bands:4,latLimit:68,gap:.25,aspect:.56,jitter:0,scaleJitter:0,roll:3,cornerRadius:.12,imageInset:.11,imageRadius:.12,segmentsX:8,segmentsY:12,spinSpeed:.15,poleAxis:{x:.5,y:.92,z:0},inertia:.48,inertiaMax:5.6,returnSeconds:2.1,drag:1,keyStep:.045,cameraFov:30,cameraMargin:1.16,pixelRatioMax:1.5,pixelBudget:8e6,atlasMaxSize:2048,atlasCellHeight:192,decodeWidth:512};function go(i={}){var t;const e=(t=i.colors)!=null&&t.length?i.colors:$n.colors;return{...$n,...i,colors:e.slice(),poleAxis:{...$n.poleAxis,...i.poleAxis},bands:Math.max(1,Math.round(i.bands??$n.bands)),gap:_o(i.gap??$n.gap,.04,.45),cornerRadius:_o(i.cornerRadius??$n.cornerRadius,.02,.45)}}function _o(i,e,t){return Math.min(t,Math.max(e,i))}function Lu(i){const e=i.radius,t=i.bands,n=i.latLimit*Math.PI/180,r=n*2/t,a=i.gap,s=i.aspect,l=i.roll*Math.PI/180,o=[];for(let c=0;c<t;c+=1){const u=-n+(c+.5)*r,d=Math.max(.12,Math.cos(u)),h=Math.PI*2*e*d,_=r*e*(1-a)*s;let x=Math.round(h/(_/(1-a)));x=Math.max(3,x);const f=Math.PI*2/x,m=f*e*d*(1-a),g=Math.min(m,_),v=g/s,T=c%2*.5;for(let O=0;O<x;O+=1){const C=o.length,B=1+(cr(C+4.7)-.5)*2*i.scaleJitter,F=Math.min(B,m/Math.max(g,1e-4));o.push({lat:u+(cr(C+8.3)-.5)*r*a*i.jitter*.55,lon:(T+O+.5)*f+(cr(C+1.1)-.5)*f*a*i.jitter,width:g*F,height:v*F,roll:(cr(C+2.2)-.5)*2*l,band:c})}}return o}function cr(i){const e=Math.sin(i*127.1+311.7)*43758.5453123;return e-Math.floor(e)}const Uu=["assets/Globe-01.webp","assets/Globe-02.webp","assets/Globe-03.webp","assets/Globe-04.webp","assets/Globe-05.webp","assets/Globe-06.webp","assets/Globe-07.webp","assets/Globe-02.webp","assets/Globe-08.webp","assets/Globe-09.webp","assets/Globe-10.webp","assets/Globe-11.webp","assets/Globe-12.webp","assets/Globe-13.webp","assets/Globe-14.webp","assets/Globe-15.webp","assets/Globe-16.webp","assets/Globe-17.webp","assets/Globe-18.webp","assets/Globe-19.webp","assets/Globe-20.webp","assets/Globe-21.webp","assets/Globe-22.webp","assets/Globe-23.webp","assets/Globe-24.webp","assets/Globe-25.webp","assets/Globe-26.webp","assets/Globe-27.webp","assets/Globe-28.webp","assets/Globe-29.webp","assets/Globe-30.webp","assets/Globe-31.webp","assets/Globe-02.webp","assets/Globe-33.webp","assets/Globe-34.webp","assets/Globe-35.webp","assets/Globe-36.webp","assets/Globe-37.webp","assets/Globe-38.webp","assets/Globe-39.webp","assets/Globe-40.webp"];function Du(i,e,t,n){const r=new pi(1,1,n.x,n.y),a=new Mu;a.index=r.index,a.setAttribute("position",r.attributes.position),a.setAttribute("uv",r.attributes.uv),a.instanceCount=i.length;const s=new Float32Array(i.length*3),l=new Float32Array(i.length*3),o=new Float32Array(i.length*3),c=new Float32Array(i.length*2),u=new Float32Array(i.length*4);return i.forEach((d,h)=>{const p=Iu(d.lat,d.lon,d.roll);s.set(p.normal,h*3),l.set(p.east,h*3),o.set(p.north,h*3),c.set([d.width,d.height],h*2);const _=e[h]||[0,0,1,1];u.set(_,h*4)}),a.setAttribute("aNormal",new _i(s,3)),a.setAttribute("aEast",new _i(l,3)),a.setAttribute("aNorth",new _i(o,3)),a.setAttribute("aSize",new _i(c,2)),a.setAttribute("aAtlas",new _i(u,4)),a.boundingSphere=new zt(new b,t*1.02),{geometry:a,plane:r}}function Iu(i,e,t){const n=Math.cos(i),r=Math.sin(i),a=Math.cos(e),s=Math.sin(e),l=[n*s,r,n*a];let o=[a,0,-s],c=[-r*s,n,-r*a];if(t){const u=Math.cos(t),d=Math.sin(t),h=[o[0]*u+c[0]*d,o[1]*u+c[1]*d,o[2]*u+c[2]*d],p=[c[0]*u-o[0]*d,c[1]*u-o[1]*d,c[2]*u-o[2]*d];o=h,c=p}return{normal:l,east:o,north:c}}const Nu=`
attribute vec3 aNormal;
attribute vec3 aEast;
attribute vec3 aNorth;
attribute vec2 aSize;
attribute vec4 aAtlas;

uniform float uSphere;

varying vec2 vUv;
varying vec2 vAtlasUv;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vAspect;

void main() {
  vUv = uv;
  vAtlasUv = aAtlas.xy + uv * aAtlas.zw;
  vAspect = aSize.x / max(aSize.y, 0.0001);

  vec2 local = position.xy * aSize;
  float ax = local.x / uSphere;
  float ay = local.y / uSphere;
  vec3 bent = normalize(
    aNormal * cos(ax) * cos(ay) +
    aEast * sin(ax) +
    aNorth * sin(ay) * cos(ax)
  ) * uSphere;

  vec4 world = modelMatrix * vec4(bent, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * aNormal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,Ou=`
uniform sampler2D uMap;
uniform float uRadius;
uniform float uBackMix;
uniform float uRimMix;
uniform vec3 uWash;
uniform vec3 uLight;

varying vec2 vUv;
varying vec2 vAtlasUv;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vAspect;

void main() {
  vec2 p = (vUv - 0.5) * vec2(vAspect, 1.0);
  vec2 box = vec2(vAspect, 1.0) * 0.5;
  float radius = uRadius * min(vAspect, 1.0);
  vec2 q = abs(p) - box + vec2(radius);
  float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  float aa = max(fwidth(dist), 0.0008);
  float alpha = 1.0 - smoothstep(-aa, aa, dist);
  if (alpha < 0.001) discard;

  vec3 col = texture2D(uMap, vAtlasUv).rgb;
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorld);

  if (!gl_FrontFacing) {
    col = mix(col, uWash, uBackMix);
  } else {
    float shade = clamp(dot(n, uLight) * 0.5 + 0.5, 0.0, 1.0);
    col *= mix(0.9, 1.03, shade);
    float rim = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 1.7);
    col = mix(col, uWash, rim * uRimMix);
  }

  // Coverage resolve already multiplies the sample by alpha. sqrt leaves
  // a premultiplied edge, (color * alpha, alpha), instead of a dark fringe.
  float coverage = sqrt(alpha);
  gl_FragColor = vec4(col * coverage, coverage);
}
`,ur=typeof document<"u"?document.currentScript:null,Fu="400px",Bu=700,zu=800,hr=Math.PI*2,Hu="Globe of images. Drag to turn it. It coasts, then the poles ease back to a diagonal.",Gu="Globe of images. Drag or use arrow keys to turn it.",vo={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};function Vu(i,e={}){if(!(i instanceof HTMLElement))throw new Error("initGlobe needs an element");let t=e;const n=go(t),r=Mo(t.sections);i.classList.add("interactive-globe"),n.background!=null&&i.style.setProperty("--ig-bg",n.background),So(i,t);let a=!1,s=null,l=null,o=null,c=!1,u=!1,d=()=>{};const h=new Promise(m=>{d=m});function p(){u||(u=!0,d())}function _(m){var g;a||m!=null&&!r.has(m)||(c=!0,o=m,(g=s==null?void 0:s.rotateTo)==null||g.call(s,m))}function x(m){var g;a||(t={...t,images:m},(g=s==null?void 0:s.setImages)==null||g.call(s,m))}function f(){a||(a=!0,l==null||l.disconnect(),l=null,s==null||s.destroy(),s=null,p())}return Cu()?(Fa(i),p(),{rotateTo:_,setImages:x,destroy:f,element:i,ready:h}):(l=new IntersectionObserver(m=>{var g;if(!(a||s)&&m.some(v=>v.isIntersecting)){l==null||l.disconnect(),l=null;try{s=xo(i,t),c&&((g=s==null?void 0:s.rotateTo)==null||g.call(s,o))}catch{s=null,Fa(i)}i.querySelector("canvas")||Fa(i),p()}},{rootMargin:Fu}),l.observe(i),{rotateTo:_,setImages:x,destroy:f,element:i,ready:h})}function xo(i,e={}){var k;if(!(i instanceof HTMLElement))throw new Error("mountGlobe needs an element");const t=go(e),n=e.drag!==!1,r=Mo(e.sections),a=new AbortController,{signal:s}=a;let l=null,o=null,c=!0,u=!0,d=!1,h=null,p=null,_=null,x=null,f=null,m=null,g=null,v=null,T=null,O=0,C=!1,B=0,F=0,D=0,W=0,j=!0,G=window.matchMedia("(prefers-reduced-motion: reduce)").matches,Y=!1,H=null,$=0,K=0,ie=0,ne=!1,fe=!1,ve=!1,ee=!1,te=0,oe=null,me=!1,ce=0,S=0,E=0,R=!1,X=null;const P=new Set;i.classList.add("interactive-globe"),t.background!=null&&i.style.setProperty("--ig-bg",t.background),So(i,e);const V=To(e);let y=Eo(e.images,V);const U=Lu(t);U.forEach((w,A)=>{w.index=A,w.color=t.colors[A%t.colors.length],w.image=yo(A,U.length,y.length)});const z=new b(0,1,0),ae=new b,N=new jt,Z=new b,J=new b,Q=new b,ue=new b(t.poleAxis.x,t.poleAxis.y,t.poleAxis.z);Yu(ue);const he=new jt().setFromUnitVectors(z,ue),ge=he.clone(),Se=new jt;function Le(){T&&(Se.setFromAxisAngle(z,te),T.quaternion.copy(ge).multiply(Se).normalize())}function Pe(){T&&(Q.copy(z).applyQuaternion(T.quaternion),!(Q.lengthSq()<1e-8)&&(Q.normalize(),ge.setFromUnitVectors(z,Q),Se.copy(ge).invert().multiply(T.quaternion).normalize(),te=Wu(Se)))}const _e=window.matchMedia("(prefers-reduced-motion: reduce)"),Ie=new ResizeObserver(()=>Ei());Ie.observe(i);const ze=new IntersectionObserver(w=>{j=w.some(A=>A.isIntersecting),j&&!document.hidden?ct():rn()});ze.observe(i),i.addEventListener("pointerdown",L,{signal:s,passive:!1}),i.addEventListener("keydown",Ke,{signal:s}),i.addEventListener("keyup",dr,{signal:s}),i.addEventListener("blur",fr,{signal:s}),i.addEventListener("contextmenu",w=>w.preventDefault(),{signal:s}),window.addEventListener("pointermove",En,{signal:s}),window.addEventListener("pointerup",Qn,{signal:s}),window.addEventListener("pointercancel",Qn,{signal:s}),document.addEventListener("visibilitychange",nn,{signal:s}),(k=_e.addEventListener)==null||k.call(_e,"change",He,{signal:s}),Ve(),j&&!document.hidden?xt()&&$e():rn();function Ve(){if(!c||d)return!1;if(!u&&h)return!0;d=!0;let w=null,A=null,q=null,re=null,le=null,de=null,xe=null;try{if(w=new _u({alpha:!0,antialias:!0,depth:!0,stencil:!1,powerPreference:"default",premultipliedAlpha:!0}),!w.getContext())throw new Error("WebGL unavailable");i.hasAttribute("tabindex")||(i.tabIndex=0),i.hasAttribute("role")||i.setAttribute("role","application"),M(),w.outputColorSpace=ut,w.setClearColor(0,0),w.setPixelRatio(1),de=w.domElement,de.draggable=!1,de.setAttribute("aria-hidden","true"),de.style.width="100%",de.style.height="100%",de.style.display="block",de.style.touchAction="none",i.append(de),xe=new AbortController,de.addEventListener("lostpointercapture",Qn,{signal:xe.signal}),le=Eu(U,{aspect:t.aspect,cellHeight:t.atlasCellHeight,maxSize:t.atlasMaxSize,imageInset:t.imageInset,imageRadius:t.imageRadius,decodeWidth:t.decodeWidth}),re=new xu(le.canvas),re.colorSpace=hn,re.wrapS=ln,re.wrapT=ln,re.generateMipmaps=!0,re.minFilter=cn,re.magFilter=Pt,re.anisotropy=Math.min(8,w.capabilities.getMaxAnisotropy()),re.needsUpdate=!0,A=Du(U,le.rects,t.radius,{x:t.segmentsX,y:t.segmentsY}).geometry;const Me={uMap:{value:re},uSphere:{value:t.radius},uRadius:{value:t.cornerRadius},uBackMix:{value:t.backMix},uRimMix:{value:t.rimMix},uWash:{value:ju(t.backWash)},uLight:{value:new b(.32,.84,.62).normalize()}};q=new Xt({uniforms:Me,vertexShader:Nu,fragmentShader:Ou,side:Wa,transparent:!1,depthTest:!0,depthWrite:!0,alphaToCoverage:!0,toneMapped:!1});const we=new vu,We=new vt(t.cameraFov,1,.08,40),Be=new _t(A,q);return Be.frustumCulled=!1,we.add(Be),h=w,p=A,_=q,x=re,f=le,m=de,g=we,v=We,T=Be,u=!1,ve=!0,F=0,D=0,Z.set(0,0,0),l==null||l.abort(),l=new AbortController,o==null||o.abort(),o=xe,Le(),Ei(),Re(),mr(),!0}catch{xe==null||xe.abort(),A==null||A.dispose(),q==null||q.dispose(),re==null||re.dispose(),le==null||le.destroy();try{w==null||w.forceContextLoss()}catch{}return w==null||w.dispose(),de==null||de.remove(),h===w&&(h=null,p=null,_=null,x=null,f=null,m=null,g=null,v=null,T=null),u=!0,!1}finally{d=!1}}function pe(){if(!u){if(u=!0,yi(),wt(),l==null||l.abort(),l=null,o==null||o.abort(),o=null,Y=!1,H!=null)try{m==null||m.releasePointerCapture(H)}catch{}H=null,P.clear(),Dt(),p==null||p.dispose(),_==null||_.dispose(),x==null||x.dispose(),f==null||f.destroy();try{h==null||h.forceContextLoss()}catch{}h==null||h.dispose(),m==null||m.remove(),h=null,p=null,_=null,x=null,f=null,m=null,T=null,g=null,v=null,ve=!1,F=0,D=0}}function Re(){!f||!l||f.load(y,{signal:l.signal,onPaint(){!c||u||(ve=!0,$e())}}).catch(()=>{})}function He(){G=_e.matches,G&&Z.set(0,0,0),M(),c&&!u&&xt()&&$e()}function nn(){if(document.hidden){rn();return}ct()}function rn(){c&&(yi(),Y=!1,H=null,Dt(),(document.hidden||!j)&&pt())}function ct(){!c||document.hidden||!j||(wt(),!(u&&!Ve())&&xt()&&$e())}function pt(){!c||u||B||(B=window.setTimeout(()=>{B=0,!(!c||u)&&(j&&!document.hidden||pe())},zu))}function wt(){B&&(window.clearTimeout(B),B=0)}function L(w){if(!(!n||!c||u||!T||!w.isPrimary||w.button>0)){w.preventDefault(),Y=!0,H=w.pointerId,$=w.clientX,K=w.clientY,ie=performance.now(),Z.set(0,0,0),Dt(),i.focus({preventScroll:!0});try{m.setPointerCapture(w.pointerId)}catch{}$e()}}function En(w){if(!Y||w.pointerId!==H||!T)return;const A=w.clientX-$,q=w.clientY-K;if($=w.clientX,K=w.clientY,A===0&&q===0)return;const re=performance.now(),le=Math.min(.05,Math.max(.001,(re-ie)/1e3));ie=re;const de=Math.max(1,Math.min(F,D)/t.cameraMargin),xe=Math.PI*(Number(t.drag)||0)/de;xi(A*xe,q*xe,le),$e()}function Qn(w){Y&&((w==null?void 0:w.pointerId)!==void 0&&w.pointerId!==H&&w.type!=="lostpointercapture"||(Y=!1,H=null,Dt(),fe&&(fe=!1,yn()),xt()&&$e()))}function Ke(w){const A=vo[w.key];!A||u||!T||(w.preventDefault(),P.add(w.key),Dt(),xi(A[0]*t.keyStep,A[1]*t.keyStep),$e())}function dr(w){vo[w.key]&&(P.delete(w.key),Dt(),!ne&&fe&&(fe=!1,yn()),xt()&&$e())}function fr(){P.clear(),Dt(),fe&&(fe=!1,yn())}function Dt(){ne=Y||P.size>0,i.classList.toggle("is-dragging",Y)}function xi(w,A,q=0){!T||!v||(N.setFromAxisAngle(z,w),T.quaternion.premultiply(N),ae.set(1,0,0).applyQuaternion(v.quaternion),N.setFromAxisAngle(ae,A),T.quaternion.premultiply(N),Pe(),fe=!0,me=!1,!(q<=0)&&(J.set(0,0,0),J.addScaledVector(z,w/q),J.addScaledVector(ae,A/q),J.length()>t.inertiaMax&&J.setLength(t.inertiaMax),Z.lerp(J,Math.min(1,Math.max(.45,q/.04)))))}function pr(w){if(c&&!(w!=null&&!r.has(w))){if(u||!T){R=!0,X=w;return}Si(w)}}function Mi(w){c&&(y=Eo(w,V),U.forEach((A,q)=>{A.image=yo(q,U.length,y.length)}),!(u||!f)&&(l==null||l.abort(),l=new AbortController,f.clear(),ve=!0,Re(),xt()&&$e()))}function mr(){!R||u||!T||(R=!1,Si(X))}function Si(w){if(w==null){oe=null,me=!1,xt()&&$e();return}oe=w,Z.set(0,0,0);const A=r.get(w);if(G||!T){te=A,me=!1,ge.copy(he),Le();return}It(A),$e()}function It(w){Number.isFinite(w)&&(ce=te,S=te+ku(te,w),E=performance.now(),me=Math.abs(S-ce)>1e-4,me||(te=S))}function yn(){oe==null||u||!T||(It(r.get(oe)),xt()&&$e())}function gr(w){if(!me)return;const A=Math.min(1,(w-E)/Bu),q=A*A*(3-2*A);te=ce+(S-ce)*q,A>=1&&(te=S,me=!1)}function Ei(){if(!c||u||!h||!v)return;const w=Math.round(i.clientWidth),A=Math.round(i.clientHeight);if(w<2||A<2)return;const q=qu(w,A,t);w===F&&A===D&&h.getPixelRatio()===q||(F=w,D=A,h.setPixelRatio(q),h.setSize(F,D,!1),ei(),$e())}function ei(){const w=F/Math.max(1,D);v.aspect=w,v.fov=t.cameraFov;const A=cl.degToRad(t.cameraFov),q=2*Math.atan(Math.tan(A/2)*w),re=t.radius/Math.sin(A/2),le=t.radius/Math.sin(q/2);v.position.set(0,0,Math.max(re,le)*t.cameraMargin),v.lookAt(0,0,0),v.updateProjectionMatrix()}function xt(){return!c||u||!h||!j||document.hidden||F<2||D<2?!1:ve||ne?!0:G?!1:oe==null||me||Z.lengthSq()>1e-6?!0:ge.angleTo(he)>8e-4}function $e(){C||!c||u||(C=!0,W=performance.now(),O=requestAnimationFrame(Ti))}function yi(){O&&cancelAnimationFrame(O),O=0,C=!1}function Ti(w){if(O=0,!c||u||!h||!T){C=!1;return}const A=Math.min(.05,(w-W)/1e3);if(W=w,ne)(w-ie)/1e3>.03&&Z.multiplyScalar(Math.exp(-A/.09));else if(G)Z.set(0,0,0),ge.copy(he),oe!=null&&(te=r.get(oe),me=!1),Le();else{const q=Z.length();oe==null&&q>.02?(N.setFromAxisAngle(J.copy(Z).multiplyScalar(1/q),q*A),T.quaternion.premultiply(N),Z.multiplyScalar(Math.exp(-A/t.inertia)),Pe()):Z.set(0,0,0),ge.slerp(he,1-Math.exp(-A/t.returnSeconds)),oe==null?(te+=t.spinSpeed*A,me=!1):gr(w),Le()}ve&&x&&(x.needsUpdate=!0,ve=!1),h.render(g,v),xt()?O=requestAnimationFrame(Ti):(C=!1,(!j||document.hidden)&&pt())}function M(){i.hasAttribute("aria-label")&&!ee||(ee=!0,i.setAttribute("aria-label",G?Gu:Hu))}function I(){c&&(c=!1,wt(),pe(),a.abort(),Ie.disconnect(),ze.disconnect(),i.classList.remove("is-dragging"))}return{rotateTo:pr,setImages:Mi,destroy:I,element:i}}function Mo(i){const e=new Map;if(!Array.isArray(i)||i.length===0)return e;const t=hr/i.length;return i.forEach((n,r)=>{if(!n||typeof n.id!="string"||n.id==="")return;const a=Number.isFinite(n.azimuth)?n.azimuth:t*r;e.set(n.id,a)}),e}function ku(i,e){let t=(e-i)%hr;return t>Math.PI&&(t-=hr),t<-Math.PI&&(t+=hr),t}function Wu(i){return 2*Math.atan2(i.y,i.w)}function So(i,e){const t=i.querySelector(".interactive-globe__poster");if(t instanceof HTMLImageElement)return t;const n=document.createElement("img");return n.className="interactive-globe__poster",n.alt="",n.decoding="async",n.draggable=!1,n.src=new URL("assets/poster.webp",To(e)).href,i.prepend(n),n}function Eo(i,e){return(Array.isArray(i)?i:Uu).map(n=>Xu(n,e)).filter(Boolean)}function yo(i,e,t){return t<=0?-1:t<=e?i%t:Math.round(i*(t-1)/Math.max(1,e-1))}function To(i){const e=i.assetBase;if(typeof e=="string"&&e.trim()!==""){const t=e.trim(),n=t.endsWith("/")?t:`${t}/`;return new URL(n,document.baseURI)}return ur!=null&&ur.src?new URL("./",ur.src):wn&&wn.tagName.toUpperCase()==="SCRIPT"&&wn.src||new URL("globe.js",document.baseURI).href?new URL("../",wn&&wn.tagName.toUpperCase()==="SCRIPT"&&wn.src||new URL("globe.js",document.baseURI).href):new URL("./",document.baseURI)}function Xu(i,e){return i?/^(?:[a-z][a-z\d+\-.]*:|\/|#)/i.test(i)?i:new URL(i,e).href:""}function qu(i,e,t){var a;let n=Math.min(window.devicePixelRatio||1,t.pixelRatioMax);(a=navigator.connection)!=null&&a.saveData&&(n=Math.min(n,1.25));const r=Math.sqrt(t.pixelBudget/Math.max(1,i*e));return Math.max(1,Math.min(n,r))}function ju(i){const e=i.trim().replace("#",""),t=e.length===3?e.split("").map(r=>r+r).join(""):e,n=Number.parseInt(t,16);return Number.isFinite(n)?new b((n>>16&255)/255,(n>>8&255)/255,(n&255)/255):new b(1,1,1)}function Yu(i){i.lengthSq()<1e-8&&i.set(.78,.62,.06),i.normalize(),Math.abs(i.z)>.32&&(i.z=Math.sign(i.z||1)*.08,i.normalize())}return Ai.initGlobe=Vu,Ai.mountGlobe=xo,Object.defineProperty(Ai,Symbol.toStringTag,{value:"Module"}),Ai})({});
