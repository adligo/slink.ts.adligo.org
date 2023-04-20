/**
  * Copyright 2023 Adligo Inc / Scott Morgan
  *
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *
  *     http://www.apache.org/licenses/LICENSE-2.0
  *
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
  */

/**
 * A simple function type to redirect output, i.e. to test console.log
 * messages so that they don't actually go to the console.
 */
export type I_Out  = (message: string) => void;

/**
 * A link list of string arrays for the builder
 */
class StringChunk {
  private chunks: string[];
  private next?: StringChunk;
  private lastChunk: number = 0;
  
  constructor(chunkSize?: number) {
    //keep the chunkSize as the chunks.lenght
    this.chunks = new Array(chunkSize);
  }
  
  public append(chars: string): StringChunk {
    if (chars == undefined) {
      return this;
    }
    if (this.lastChunk == 0) {
      //first element
      let cc: string = this.chunks[0];
      if (cc == undefined) {
        this.chunks[0] = chars  
      } else if (cc.length < this.chunks.length){
        this.chunks[0] = cc.concat(chars);
      } else {
        this.chunks[1] = chars;
        this.lastChunk = 1
      }
      return this;
    } else {
      let cc: string = this.chunks[this.lastChunk];
      if (this.lastChunk < this.chunks.length - 2) {
        if (cc == undefined) {
          this.chunks[this.lastChunk] = chars;
        } else if (cc.length < this.chunks.length) {
          this.chunks[this.lastChunk] = cc.concat(chars);
        } else {
          this.chunks[this.lastChunk] = chars;
          this.lastChunk++;
        }
        return this;
      } else {
        //last element
        if (cc == undefined) {
          this.chunks[this.lastChunk] = chars;
        } else if (cc.length < this.chunks.length){
          this.chunks[this.lastChunk] = cc.concat(chars);
        } else {
          //append to the linked list
          this.next = new StringChunk(this.chunks.length);
          return this.next;
        }
        return this;
      }
    }
  }
  
  public getNext() : StringChunk {
    if (this.next == undefined) {
      throw Error('IllegalStateException this.next MUST NOT be null at this point!');
    }
    return (this.next as StringChunk);
  }
  
  public hasNext(): boolean {
    if (this.next == undefined) {
      return false;
    }
    return true;
  }
  public toString(): string {
    var chars = this.chunks[0];
    if (chars == undefined) {
      return '';
    }
    for (var i=1; i<this.chunks.length; i++) {
      let cs = this.chunks[i];
      if (cs == undefined) {
        return chars;
      } else {
        chars = chars.concat(cs);
      }
    }
    return chars;
  }
}

/**
 * Similar in function to Java's StringBuilder
 * it doesn't use only an array under the hood,
 * so large strings will perform slightly faster.
 */
export class StringBuilder {
  private first: StringChunk;
  private last: StringChunk;
  
  constructor(chunkSize?: number) {
    this.first = new StringChunk(chunkSize);
    this.last = this.first;
  }
  public append(chars: string): StringBuilder {
    this.last = this.last.append(chars);
    return this;
  }
  public toString(): string {
    var chars = '';
    var next: StringChunk = this.first;
    while(next.hasNext()) {
      chars = chars.concat(next.toString());
      next = next.getNext();
    }
    return chars;
  }
}