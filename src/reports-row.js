import React, { Component } from 'react';
import T from 'components/i18n';
import Money from 'components/money';
import ExpensesStore from '../expenses/expenses-store';
import formatDate from 'tools/format-date';
import NumberBlock from 'components/number-block';

import List from 'react-bulma-components/lib/components/list';
import Columns from 'react-bulma-components/lib/components/columns';
// -----------Мій код--------------
import OpenModalButton from 'components/modal/open-modal-button';
// --------------------------------
// import Heading from 'react-bulma-components/lib/components/heading';

import User from 'user/user-store';

import { isMobile } from 'react-device-detect';

import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Actions from './expenses-actions';

import Level from 'react-bulma-components/lib/components/level';
import Button from 'react-bulma-components/lib/components/button';

import { Link } from 'react-router-dom';

class ReportsRow extends Component {
  constructor(props) {
    super(props);

    this.deleteExpenses = this.deleteExpenses.bind(this);
    this.renderDesktop = this.renderDesktop.bind(this);
    this.renderMobile = this.renderMobile.bind(this);
    this.openModal = this.openModal.bind(this);
  }

  deleteExpenses(_id) {
    // функція яка викликає повідомлення чи дійсно ви хочете видалити цю витрату.
    // є дві кнопки : видалити і закрити не видаляючи.
    confirmAlert({
      title: T('confirm-delete'),
      message: T('are-you-sure-to-delete-this-expenses'),
      buttons: [
        {
          label: T('delete'),
          onClick: () => Actions.deleteExpenses(_id),
        },
        {
          label: T('no-delete'),
          onClick: () => {},
        },
      ],
    });
  }

  getExpensesName(data) {
    // перевіряєata.name символи "t-" , якщо є то поверне index (число >= 0),

    let name = data['name'].indexOf('t-') > -1 ? T(data['name']) : data['name'];

    if (data['shipment_id']) {
      // якщо є shipment_id (вілідне значення) до до name дописуємо все що нижче.
      name += '. ' + T('shipment') + ' ID: ' + data['shipment_id'];
    }

    return name;
    // повертаємо name
  }

  renderMobile(amount, data) {
    //функція повертає розмітку дял мобільної версії. Строка в таблиці.

    return (
      // унікальний key щоб реакт правильно працював з колекцією строк таблиці.
      // нижче додані інлайн стилі.
      // ще нижче якісь компоненти в які передають різні пропси. Треба бачити більше коду для детального розуміння ;)
      <tr key={data['id']} className="is-size-7" colSpan="7">
        <td style={{ textAlign: 'left', paddingTop: '12px' }}>
          <b style={{ fontSize: '1.5rem' }}>{this.getExpensesName(data)}</b>
          <Level className="is-mobile margin-bottom0">
            <Level.Side align="left">
              <Level.Item>
                {T('reports-type')}: {T(data['expenses_type'])}
              </Level.Item>
            </Level.Side>
            <Level.Side align="right">
              <Level.Item>{formatDate(data['created_at'])}</Level.Item>
            </Level.Side>
          </Level>
          <List>
            <List.Item>
              <b>
                {T('reports-category')}:{' '}
                <span className="text-success">{T(data['category_name'])}</span>
              </b>
            </List.Item>
            <List.Item>
              {T('reports-account')}:
              {/* Забираємо данні по  account_id з глобального store*/}
              {T(ExpensesStore.getAccountName(data['account_id']))}
            </List.Item>
          </List>
          <Columns className="is-mobile product-mobile-block">
            <Columns.Column size="half">
              <NumberBlock
                top="reports-amount"
                number={amount}
                bottom={User.getCurrency()}
                className="small-number-box"
              />
            </Columns.Column>
            <Columns.Column>
              <NumberBlock
                top="reports-balance"
                number={data['balance']}
                bottom={User.getCurrency()}
                className="small-number-box"
              />
            </Columns.Column>
          </Columns>

          <Level renderAs="nav" breakpoint="mobile" className="is-mobile">
            <Level.Side align="left">
              <Level.Item></Level.Item>
            </Level.Side>
            <Level.Side align="right">
              <Level.Item>
                <Button
                  size="small"
                  rounded
                  color="light"
                  onClick={() => this.deleteExpenses(data['id'])}
                >
                  <FontAwesomeIcon
                    icon="trash-alt"
                    size="2x"
                    title={T('delete')}
                  />
                </Button>
                {/* --------------------Мій код------------------- */}
                {/* Я так розумію , що кнопка  OpenModalButton глобально контролює відкриття модалки.
                Тобто десь у батьківському компоненті рендереться модалка по умові visibleModal true aбо false.
                Властивість visibleModal знаходиться в AppStore. Такі висновки я зробив бо знайшов в файлі модалки такий запис:  AppStore.closeModal().
                AppStore.closeModal() робить властиість visibleModal : false і модалка не відображається.
                В компоненті OpenModalButton є параметр state (знайшов його в файлі shipment-row) в який ми можемо передати данні для редагування.
                OpenModalButton зв'язаний з AddExpensesModal. Тобто ми передаємо данні через компонент OpenModalButton в AddExpensesModal.
                Для зручності заміню  state на stateData 
                */}
                <OpenModalButton
                  size="small"
                  link="/expenses/edit-expenses"
                  color="success"
                  text={T('edit-expenses-btn')}
                  icon="fa-solid fa-pen-to-square"
                  stateData={data}
                />
                {/* --------------------------------------------- */}
              </Level.Item>
            </Level.Side>
          </Level>
        </td>
      </tr>
    );
  }

  renderDesktop(amount, data) {
    // функція повертає розмітку для десктопного варіанту застосунку
    // це строка таблиці з комірками
    return (
      <tr key={data['id']}>
        <td>{formatDate(data['created_at'])}</td>
        <td>{T(data['category_name'])}</td>
        <td>{this.getExpensesName(data)}</td>
        <td>{T(data['expenses_type'])}</td>
        <td>
          <Money
            amount={amount}
            aid={data['account_id']}
            signClassname={true}
          />
        </td>
        <td>
          <Money amount={data['balance']} aid={data['account_id']} />
        </td>
        <td>{T(ExpensesStore.getAccountName(data['account_id']))}</td>
        <td>
          <Link
            to="#"
            onClick={() => this.deleteExpenses(data['id'])}
            title={T('delete')}
          >
            <FontAwesomeIcon icon="trash-alt" size="1x" />
          </Link>
          {/* ----------Мій код----------- */}
          {/* Для шдентичності можливо треба зробити не кнопку а лінку у вигляді кнопки,
          треба більш детально дивитися компонент OpenModalButton*/}
          <OpenModalButton
            size="medium"
            link="/expenses/edit-expenses"
            color="success"
            text={T('edit-expenses-btn')}
            icon="fa-solid fa-pen-to-square"
            stateData={data}
          />
          {/* ------------------------- */}
        </td>
      </tr>
    );
  }

  render() {
    // тернарник. визначаємо де відкрито застосунок (десктоп чи телефон)
    // і в buildRow записуємо відповідну функцію (this.renderMobile або this.renderDesktop ) яка поверне відповідну розмітку.
    const buildRow = isMobile ? this.renderMobile : this.renderDesktop,
      { data } = this.props;
    let amount = data['amount'];
    if (!data['is_receipt']) {
      amount *= -1;
    }
    // викликаємо функція buildRow і передаємо в неї необхідні аргументи
    return buildRow(amount, data);
  }
}

export default ReportsRow;
