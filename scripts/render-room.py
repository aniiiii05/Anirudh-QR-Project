"""Rasterize the original Three.js scene with a depth buffer for its static fallback."""
import json
import numpy as np
from PIL import Image
scale=2
width,height=1200*scale,900*scale
canvas=np.empty((height,width,3),dtype=np.uint8);canvas[:]=[229,232,220]
depth=np.full((height,width),np.inf)
for face in json.load(open('artifacts/room-faces.json')):
    points=np.array(face['p']);points[:,:2]*=scale
    x0,y0,z0=points[0];x1,y1,z1=points[1];x2,y2,z2=points[2]
    lo=np.maximum(np.floor(points[:,:2].min(axis=0)).astype(int),[0,0]);hi=np.minimum(np.ceil(points[:,:2].max(axis=0)).astype(int),[width-1,height-1])
    if np.any(hi<lo):continue
    den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
    if abs(den)<1e-8:continue
    x,y=np.meshgrid(np.arange(lo[0],hi[0]+1)+.5,np.arange(lo[1],hi[1]+1)+.5)
    a=((y1-y2)*(x-x2)+(x2-x1)*(y-y2))/den;b=((y2-y0)*(x-x2)+(x0-x2)*(y-y2))/den;c=1-a-b
    z=a*z0+b*z1+c*z2;d=depth[lo[1]:hi[1]+1,lo[0]:hi[0]+1];pixels=canvas[lo[1]:hi[1]+1,lo[0]:hi[0]+1]
    mask=(a>=-1e-5)&(b>=-1e-5)&(c>=-1e-5)&(z<d);d[mask]=z[mask];pixels[mask]=face['c']
Image.fromarray(canvas).resize((1200,900),Image.Resampling.LANCZOS).save('public/workspace-room.png')
