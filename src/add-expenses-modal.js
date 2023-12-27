import React, { Component } from 'react';
import T from 'components/i18n';
import { connectToStores } from 'tools/reflux-tools';
import getQueryParams from 'tools/query-params';
import { redirectTo } from 'tools/redirect-to';
import {
  Field,
  Control,
  Input,
  Radio,
  Label,
} from 'react-bulma-components/lib/components/form';

import Messages from 'components/messages';
import DatePicker from 'react-datepicker';

import 'react-datepicker/dist/react-datepicker.css';

import Box from 'react-bulma-components/lib/components/box';
import Columns from 'react-bulma-components/lib/components/columns';
import Button from 'react-bulma-components/lib/components/button';

import ExpensesStore from './expenses-store';
import ExpensesActions from './expenses-actions';
import ProductsStore from '../products/products-store';

import ShipmentsStore from '../shipments/shipments-store';
import ShipmentsActions from '../shipments/shipments-actions';

import SelectComponent from 'tools/select-component';
import AppStore from 'app-store';

import SubmitButton from 'components/submit-button';
import trackEvent from 'tools/track-events';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { Link } from "react-router-dom";
import User from 'user/user-store';
import { isMobile } from 'react-device-detect';

// import SelectComponent from 'tools/select-component'

class AddExpensesModal extends Component {
  constructor(props) {
    super(props);
    // -----Мій код----------
    const { stateData } = this.props;
    // ----------------------
    let category = null;
    if (this.props.category_id) {
      category = {
        value: this.props.category_id,
      };
    }

    let shipment = null;
    if (this.props.shipment_id) {
      shipment = {
        value: this.props.shipment_id,
      };
    }
    // ---------Додано код ------------
    //  Вище витягнув з пропсів stateData. якщо stateData не undefined то беремо з цього об'єкту
    // відповідні поля і заповнюємо стейт.
    this.state = {
      id: stateData?._id || null,
      comment: {
        error: '',
        value: stateData?.comment || this.props.comment || '',
      },
      amount: {
        error: '',
        value: stateData?.amount || this.props.amount || '',
      },
      types: {
        error: '',
        value: '1',
      },
      account: stateData?.account || null,
      date: new Date(),
      category: stateData?.category || category,
      shipment: stateData?.shipment || shipment,
      message: stateData?.message || null,
      waiting: stateData?.waiting || null,
      product: stateData?.product || null,

      close: false,
    };
    // -------------------------------------
    this.onChange = this.onChange.bind(this);
    this.onChangeSelect = this.onChangeSelect.bind(this);
    this.onChangeDateSaled = this.onChangeDateSaled.bind(this);

    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    // ця функція спарцьовує при монтуванні компоненту модального вікна
    // -----додано код--------
    // Перевіряємо чи product не null. Якщо в product є валідне значення то значить мі редагуємо витрати.
    // якщо product дорівнює null , то намагаємося витягти product_id з параметрів запиту і записати іstate.
    if (!this.state.product) {
      let product_id = getQueryParams('product');
      if (product_id) {
        this.setState({ product: { value: product_id, error: '' } });
      }
    }

    this.listenAddFaild = ExpensesActions.addExpenses.failed.listen(res => {
      // додаємо слухач подій , якщо сталася помилка то додаємо error message в state
      const data = JSON.parse(res['response']);
      this.setState({
        waiting: false,
        message: {
          msg: T(data['error']),
        },
      });
    });

    this.listenAddCompleted = ExpensesActions.addExpenses.completed.listen(
      () => {
        // слухач подій який закриває модалку коли все пройщло успіщно
        setTimeout(() => {
          this.setState({ close: true });
          AppStore.closeModal();
        }, 100);
      }
    );
  }

  componentWillUnmount() {
    // спрацьовую при розмонтуванні модального вікна
    if (typeof this.listenAddFaild == 'function') {
      this.listenAddFaild();
    }
    if (typeof this.listenAddCompleted == 'function') {
      this.listenAddCompleted();
    }
  }

  submit(id) {
    // ця функція спрацьовує коли ми натискаємо на кнопку відправки в формі модального вікна.
    if (!this.state.account || this.state.account.value === 0) {
      //  якщо account === null або account.value === 0 , записуємо в state відповідне
      // повідомлення , повертаємо false і віходимо з функції.
      this.setState({
        message: {
          msg: T('not all fields required'),
        },
      });

      return false;
    }
    const account = this.state.account.value,
      comment = this.state.comment.value,
      types = this.state.types.value,
      date = this.state.date,
      category = this.state.category.value,
      shipment =
        this.state.shipment && this.state.shipment.value
          ? this.state.shipment.value
          : 0,
      amount = this.state.amount.value || 0;

    if (comment.trim() === '' || amount <= 0) {
      //  якщо в comment пуста строка, або amount <= 0 записуємо в state відповідне
      // повідомлення , повертаємо false і віходимо з функції.
      // trim прибирає всі пробіли перед і після символів в строці, але не в середині.
      this.setState({
        message: {
          msg: T('not all fields required'),
        },
      });

      return false;
    }

    let inventory_id = 0;
    if (this.props.stateData?.inventory_id || this.props.inventory_id) {
      inventory_id =
        this.props.stateData?.inventory_id || this.props.inventory_id;
    }

    this.setState({ waiting: true });

    ExpensesActions.addExpenses(
      id,
      account,
      amount,
      comment,
      types,
      category,
      shipment,
      date,
      inventory_id
    );
    // треба редагувати метод addExpenses. Робити перевірку, якщо id === null , то значить
    //  ми створюємо нову витрату. У іншому випадку редагуємо і треба правильно оновити виттрату в базі данних.
    // створюється об'єкт з інформацією про витрати і додається в базу данних
    trackEvent('users', 'working', 'add-expenses');
  }

  onChange(evt) {
    // універсальна функція для синхронізації state та інформації в input.
    // Вводимо данні input , вони записуються в відповідне поле state і все корректно відображається
    //  на екрані
    const value = evt.target.value,
      name = evt.target.name;

    this.setState({
      [name]: {
        value: value,
      },
    });
  }

  onChangeDateSaled(date) {
    // функція яка змінює дату.
    this.setState({
      date: date,
    });
  }

  onChangeSelect(selectedOption, actionMeta) {
    // записує в state відповідне значення вибраного селекту
    this.setState({
      [actionMeta.name]: selectedOption,
    });
  }

  render() {
    // Рендеремо модальне вікно з формою, передающи данні зі state в відповідні компоненти.
    const mess =
      this.state.message && this.state.message['msg']
        ? this.state.message['msg']
        : null;
    return (
      <div>
        <Messages
          message={mess}
          close={() => this.setState({ message: null })}
        />
        <Box>
          <Field>
            <Control>
              <Label>{T('expenses-amount')}</Label>
              <Input
                size="large"
                name="amount"
                type="number"
                min="0.01"
                placeholder={T('expenses-amount-placeholder')}
                onChange={this.onChange}
                color={this.state.amount.error ? 'danger' : ''}
                value={this.state.amount.value}
              />
            </Control>
          </Field>

          <Field>
            <Control>
              <Label>{T('expenses-name')}</Label>
              <Input
                size="large"
                name="comment"
                type="text"
                placeholder={T('expenses-comment-placeholder')}
                onChange={this.onChange}
                color={this.state.comment.error ? 'danger' : ''}
                value={this.state.comment.value}
              />
            </Control>
          </Field>

          <Field>
            <SelectComponent
              name="category"
              label="expenses-category"
              onChange={this.onChangeSelect}
              value={this.state.category}
              list={ExpensesStore.getCategoryList}
              addItem={ExpensesActions.addCategory}
              load={ExpensesActions.loadCategory}
              creatable={true}
            />
          </Field>
          {this.state.category && this.state.category.value === 11 ? (
            <Field>
              <SelectComponent
                name="shipment"
                label="select-shipment"
                onChange={this.onChangeSelect}
                value={this.state.shipment}
                list={() => ShipmentsStore.getList()}
                load={ShipmentsActions.load}
                creatable={false}
              />
            </Field>
          ) : null}
          <Field>
            <Label>{T('expenses-type')}</Label>
            <Control>
              <Radio
                onChange={this.onChange}
                checked={this.state.types.value === '1'}
                value="1"
                size="large"
                name="types"
              >
                {ExpensesStore.getNameTypeExpenses(1)}
              </Radio>
              <Radio
                onChange={this.onChange}
                checked={this.state.types.value === '2'}
                value="2"
                size="large"
                name="types"
              >
                {ExpensesStore.getNameTypeExpenses(2)}
              </Radio>
            </Control>
          </Field>
          <Columns className={isMobile ? 'is-mobile' : ''}>
            <Columns.Column>
              <Field>
                <SelectComponent
                  name="account"
                  label="debit-the-account"
                  onChange={this.onChangeSelect}
                  value={this.state.account}
                  list={() => ExpensesStore.getPersonalAccounts()}
                  load={ExpensesActions.loadAccounts}
                  creatable={false}
                />
              </Field>
            </Columns.Column>
            <Columns.Column>
              <Field>
                <Label>{T('sale-date')}</Label>
                <Control>
                  <DatePicker
                    selected={this.state.date}
                    onChange={this.onChangeDateSaled}
                    className="input"
                    dateFormat="dd-MM-yyyy"
                    popperPlacement="top-left"
                    showTimeInput
                    locale={User.getLang()}
                    maxDate={new Date()}
                    timeFormat="HH:mm"
                  />
                </Control>
              </Field>
            </Columns.Column>
          </Columns>

          <Button.Group>
            <SubmitButton
              // Додано тернарний оператор. якщо this.state.id не null, то значить це редагування
              // витрати.
              text={this.state.id ? 'edit-expenses-btn' : 'add-expenses-btn'}
              waiting={this.state.waiting}
              submit={() => this.submit(this.state.id)}
              // при натисканні викликається функція submit
            />
          </Button.Group>
          {/* якщо все успішно, модалка закривається і нас перенаправляє на сторінку оплати */}
          {this.state.close ? redirectTo('/payments') : ''}
        </Box>
      </div>
    );
  }
}

export default connectToStores(AddExpensesModal, {
  expenses: ExpensesStore,
  products: ProductsStore,
});
