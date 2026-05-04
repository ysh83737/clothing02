mkdir -p build
cp -rL .next/standalone build
cp -r .next/static build/standalone/.next
cp -r public build/standalone
tar -cvf build.tar build
