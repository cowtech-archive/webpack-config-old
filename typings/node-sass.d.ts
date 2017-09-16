declare module 'node-sass'{
  interface Value{
    getValue(): string;
  }

  namespace types{
    class String{
      constructor(path: string);
    }
  }
}
