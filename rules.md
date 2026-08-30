For things like defining variables.
like fonts, colors, design, appid, etc.
use the following context.

tsconfig.json
-> "$/*" means "./base/*" use this
-> assets will also be in here.
-> app logos will be in here.


for things that are not specific to just this applications.
we use, our neup standard.

tsconfig.json
-> "#/*" meaning "./.neup/*"
for storing things like:

#/components -> universal ui components like buttons, toasts.
#/components/ui -> for universal uis.
#/components/elements -> for universal elements like toasts.
#/components/

#/core -> for functions and helpers.
#/logica -> for the neup system sdk.



for files that are only specific to android or ios use:
"@android/*" -> "./android/*"
"@ios/*" -> respective folder for ios specific code generated.
