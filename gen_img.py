import sys,time,torch
from diffusers import AutoPipelineForText2Image
torch.set_num_threads(2)
p=AutoPipelineForText2Image.from_pretrained("stabilityai/sd-turbo",torch_dtype=torch.float32,variant="fp16")
style=", flat 2D vector storybook illustration, warm soft colors, clean lines, children's book, highly detailed background, cinematic wide shot"
for i,(name,prompt) in enumerate([("s01","Varanasi ghats at sunrise, river Ganga, temples, wooden boats, people bathing"),("s02","cute simple cartoon girl with big round white face and black hair, yellow kurta, standing on a wooden boat on river")]):
  t=time.time(); im=p(prompt+style,num_inference_steps=2,guidance_scale=0.0,width=768,height=432).images[0]
  im.save(f"out/sample/{name}.png"); print(name,time.time()-t,flush=True)
