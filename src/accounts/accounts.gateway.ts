import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@WebSocketGateway()
export class AccountsGateway {
  constructor(private readonly accountsService: AccountsService) {}

  @SubscribeMessage('createAccount')
  create(@MessageBody() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @SubscribeMessage('findAllAccounts')
  findAll() {
    return this.accountsService.findAll();
  }

  @SubscribeMessage('findOneAccount')
  findOne(@MessageBody() id: number) {
    return this.accountsService.findOne(id);
  }

  @SubscribeMessage('updateAccount')
  update(@MessageBody() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(updateAccountDto.id, updateAccountDto);
  }

  @SubscribeMessage('removeAccount')
  remove(@MessageBody() id: number) {
    return this.accountsService.remove(id);
  }
}
