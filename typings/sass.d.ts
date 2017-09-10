declare module 'sass'{
  interface Value{
    getValue(): string;
  }

  namespace types{
    class String{
      constructor(path: string);
    }
  }
}
