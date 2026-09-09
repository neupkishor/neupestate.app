For things like defining variables.
like fonts, colors, design, appid, etc.
use the following context.

tsconfig.json
-> "@/base/*" means "./.neup/base/*" use this
-> assets will also be in here.
-> app logos will be in here.


for things that are not specific to just this applications.
we use, our neup standard.

tsconfig.json
-> "@/neup/*" meaning "./.neup/*"
for storing things like:

@/neup/components -> universal ui components like buttons, toasts.
@/neup/components/ui -> for universal uis.
@/neup/components/elements -> for universal elements like toasts.
@/neup/components/

@/neup/core -> for functions and helpers.
@/neup/logica -> for the neup system sdk.



for files that are only specific to android or ios use:
"@android/*" -> "./android/*"
"@ios/*" -> respective folder for ios specific code generated.
