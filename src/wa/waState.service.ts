import { Injectable } from '@nestjs/common';
import { StoreService } from 'src/store/store.service';
import { AuthenticationCreds, AuthenticationState, SignalDataTypeMap } from '@whiskeysockets/baileys';
import { BufferJSON, initAuthCreds } from '@whiskeysockets/baileys/lib/Utils';


@Injectable()
export class WaStateService {
    constructor(private readonly storeService: StoreService) {}
  private getKey(sessionId: string, file?: string): string {
    if (!file) return `wa:${sessionId}:creds`;
    return `wa:${sessionId}:${file.replace(/\//g, '__').replace(/:/g, '-')}`;
  }

  private async writeData(sessionId: string, data: any, file: string): Promise<void> {
    const key = this.getKey(sessionId, file);
    await this.storeService.set(key, JSON.stringify(data,BufferJSON.replacer));
  }

  private async readData<T>(sessionId: string, file: string): Promise<T | null> {
    const key = this.getKey(sessionId, file);
    const data = await this.storeService.get(key);
    return data ? JSON.parse(data,BufferJSON.reviver) : null;
  }

  private async removeData(sessionId: string, file: string): Promise<void> {
    const key = this.getKey(sessionId, file);
    await this.storeService.del(key);
  }

  async getAuthState(sessionId: string): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
  }> {
    const creds: AuthenticationCreds = (await this.readData<AuthenticationCreds>(sessionId, 'creds')) || initAuthCreds();

    return {
      state: {
        creds,
        keys: {
          get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
            const data: { [_: string]: SignalDataTypeMap[T] } = {};
            
            await Promise.all(
              ids.map(async (id) => {
                const value = await this.readData<SignalDataTypeMap[T]>(sessionId, `${type}-${id}`);
                if (value !== null) {
                  data[id] = (value as unknown )as SignalDataTypeMap[T];
                }
              })
            );

            return data;
          },
          set: async (data) => {
            const tasks: Promise<void>[] = [];
            
            for (const category in data) {
              for (const id in data[category]) {
                const value = data[category][id];
                const file = `${category}-${id}`;
                
                tasks.push(
                  value !== null && value !== undefined
                    ? this.writeData(sessionId, value, file)
                    : this.removeData(sessionId, file)
                );
              }
            }
            
            await Promise.all(tasks);
          },
        },
      },
      saveCreds: async () => {
        return this.writeData(sessionId, creds, 'creds');
      },
    };
  }

  async clearAuthState(sessionId: string): Promise<void> {
    await this.storeService.delKeys(`wa:${sessionId}:*`);
  }

}
