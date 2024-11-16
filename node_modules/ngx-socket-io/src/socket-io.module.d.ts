import { ModuleWithProviders, InjectionToken } from '@angular/core';
import { SocketIoConfig } from './config/socket-io.config';
import { WrappedSocket } from './socket-io.service';
import * as i0 from "@angular/core";
/** Socket factory */
export declare function SocketFactory(config: SocketIoConfig): WrappedSocket;
export declare const SOCKET_CONFIG_TOKEN: InjectionToken<SocketIoConfig>;
export declare class SocketIoModule {
    static forRoot(config: SocketIoConfig): ModuleWithProviders<SocketIoModule>;
    static ɵfac: i0.ɵɵFactoryDeclaration<SocketIoModule, never>;
    static ɵmod: i0.ɵɵNgModuleDeclaration<SocketIoModule, never, never, never>;
    static ɵinj: i0.ɵɵInjectorDeclaration<SocketIoModule>;
}
