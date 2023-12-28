import React, { Component } from 'react';
import T from 'components/i18n';
import Money from 'components/money';
import WarehouseStore from 'modules/warehouse/warehouse-store';
import ShipmentsStore from 'modules/shipments/shipments-store';
import ProductsStore from 'modules/products/products-store';
import ExpensesStore from 'modules/expenses/expenses-store';
import Level from 'react-bulma-components/lib/components/level';
import OpenModalButton from 'components/modal/open-modal-button';
import Dropdown from 'react-bulma-components/lib/components/dropdown';

import NumberBlock from 'components/number-block';
import User from 'user/user-store';
import formatDate from 'tools/format-date';

import DOM from 'react-dom-factories';
import { confirmAlert } from 'react-confirm-alert'; // Import
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Actions from './shipments-actions';

import List from 'react-bulma-components/lib/components/list';
import Columns from 'react-bulma-components/lib/components/columns';
import Heading from 'react-bulma-components/lib/components/heading';
import OpenInsideModal from 'components/modal/open-inside-modal';
import AddExpensesModal from 'modules/expenses/add-expenses-modal';

import { isMobile } from 'react-device-detect';

class ShipmentsRow extends Component {
  getPaymentButton(data, total_pay) {
    // функція повертає розмітку і модальне вікно. Виводить message-попередження якщо total_pa > 0.
    //    треба бачити більше коду для детального розуміння
    return (
      <Columns key="payment-button" className={isMobile ? 'is-mobile' : null}>
        <Columns.Column size="one-third">
          <OpenInsideModal
            size="small"
            className="margin-top-10"
            text={T(isMobile ? 'pay-shipment-mobile-btn' : 'pay-shipment-btn')}
          >
            <AddExpensesModal category_id={11} shipment_id={data['id']} />
          </OpenInsideModal>
        </Columns.Column>
        <Columns.Column
          className={isMobile ? null : 'margin-top-20'}
          align="right"
        >
          {total_pay > 0 ? (
            <b className="has-text-danger">
              {T('not-paid')}:{' '}
              <Money
                currency={data['currency']}
                amount={total_pay}
                className="has-text-danger"
                wrapper={DOM.span}
              />
            </b>
          ) : null}
        </Columns.Column>
      </Columns>
    );
  }

  getDeliveryInfo(data) {
    //   виводить інформацію о доставці
    //  з об'єкту data достаємо потрібні властивості.
    // якщо в is_delivery_pay є валідне значення, то виводимо информацію на єкран.
    //  якщо немає - повертаємо пусту строку
    // для більш детального розуміння треба бачити компонент Money
    const is_delivery_pay = !!data['delivery_expenses_id'];

    if (is_delivery_pay) {
      const daid = data['delivery_expenses']['account_id'];

      return (
        <div key={'k2'}>
          <b className="has-text-success">
            {' '}
            {T('delivery_paid')}:{' '}
            <Money
              aid={daid}
              amount={data['delivery_expenses']['amount']}
              className="has-text-success"
              wrapper={DOM.span}
            />{' '}
          </b>
          {' ' + T('from_account')}{' '}
          <b>{T(ExpensesStore.getAccountName(daid))} </b>
          <br />
        </div>
      );
    }

    return '';
  }

  getPaymentInfo(data) {
    //   функція повертає розмітку з інформацією про оплату.
    const is_pay = !!data['expenses_id'];

    let response = [];
    if (is_pay) {
      // якщо is_pay вілідне значення то в response додаємо div з ключем key={'kp2'}
      response.push(
        <div key={'kp2'}>
          <b> {T('received_goods_worth')}:</b>{' '}
          <Money
            currency={data['currency']}
            amount={data['received_amount']}
            wrapper={DOM.span}
          />{' '}
        </div>
      );

      let total_aid = 0,
        total_pay = 0;
      for (let i in data['expenses']) {
        //   в об'єкті data['expenses'] в кожній із властивостей знаходиться информація
        //   про оплату. проходимось циклом for in по об'єкту і на кожній ітерації створюємо розмітку
        //   з інформацією по кожному платежу. кожний раз пушимо розмітку в масив response.
        //   функція поверне розмітку з декількох div з інформацією про оплату.
        const expenses = data['expenses'][i];
        const aid = expenses['account_id'];
        total_aid = aid;
        total_pay += expenses['amount'];
        response.push(
          <div key={'k1-' + expenses['id']}>
            <b className="has-text-success">
              {' '}
              {T('paid')}:{' '}
              <Money
                aid={aid}
                amount={expenses['amount']}
                className="has-text-success font-size-120"
                wrapper={DOM.span}
              />
            </b>
            {' ' + T('from_account')}{' '}
            <b>{T(ExpensesStore.getAccountName(aid))}</b>
            <br />
          </div>
        );
      }

      if (data['expenses'].length > 1) {
        response.push(
          <div key={'total-' + data['expenses_id']}>
            <b className="has-text-success">
              {' '}
              {T('total')}:{' '}
              <Money
                aid={total_aid}
                amount={total_pay}
                className="has-text-success font-size-120"
                wrapper={DOM.span}
              />
            </b>
          </div>
        );
      }

      response.push(this.getDeliveryInfo(data));

      if (total_pay < data['received_amount']) {
        response.push(
          this.getPaymentButton(data, data['received_amount'] - total_pay)
        );
      }
    } else if (data['shipment_status'] === 'complete') {
      response.push(
        <div key={'k1'}>
          <b>{T('received_goods_worth')}:</b>{' '}
          <Money amount={data['received_amount']} wrapper={DOM.span} /> <br />
          <b>{T('shipment-not-paid-status')}</b>
          <br />
        </div>
      );

      response.push(this.getDeliveryInfo(data));
      response.push(this.getPaymentButton(data, 0));
    } else {
      response.push(
        <div key="k2">
          <b> {T('expected_goods_worth')}:</b>{' '}
          <Money
            amount={data['amount']}
            currency={data['currency']}
            wrapper={DOM.span}
          />
        </div>
      );
    }
    //   в залежності від різних перевірок пушимо в массив response відповідну html розмітку
    //   з інформацією про платежі, оплату.
    //   функція повертаю всю цю розмітку з массива response.
    return <div>{response}</div>;
  }

  desktopRender() {
    //   функція повертає строку таблиці для десктопної версії застосунку
    //

    const { data } = this.props;
    let comment = '';
    if (data['comment'] && data['comment'] !== '') {
      comment = (
        <>
          {' '}
          <b>{T('shipments-comment')}:</b> {data['comment']}{' '}
        </>
      );
    }
    let classname = 'is-size-7';

    if (data['shipment_status'] === 'saled') {
      classname += ' opacity05';
    }
    return (
      <tr className={classname}>
        <td align="left" width="30%">
          ID: {data['id']}. {data['name']}{' '}
          {data['supplier_id']
            ? '(' +
              T('from') +
              ' ' +
              T(ShipmentsStore.getSupplierName(data['supplier_id'])) +
              ')'
            : ''}
          <br />
          <b>{T('shipments-created_at')}:</b> {formatDate(data['created_at'])}{' '}
          <br />
          <b>{T('delivery-delivery')}:</b>{' '}
          {data['delivered_date']
            ? formatDate(data['delivered_date'])
            : T('supply')}{' '}
          <br />
          <b>{T('on-warehouse')}:</b>{' '}
          {T(WarehouseStore.getWarehouseName(data['marketplace_id']))} <br />
          {ExpensesStore.hasManyCurrencies() &&
          parseInt(data['currency']) !== parseInt(User.get('currency_id')) ? (
            <span>
              <b>{T('shipment-currency')}:</b>{' '}
              {User.getCurrency(data['currency'])} <br />
              <b>{T('exchange-rate')}:</b>{' '}
              <Money amount={data['currency_rate']} wrapper={DOM.span} />
              <br />
            </span>
          ) : null}
          {comment}
          <Level className="margin-top-5">
            <Level.Side align="left">
              {data['shipment_status'] === 'pending'
                ? this.getPendingButton()
                : ''}
              {data['shipment_status'] === 'complete'
                ? this.getCompeteButton()
                : ''}
              <Level.Item>{this.getPrintButton(data.id)}</Level.Item>
              <Level.Item>
                <Link
                  to={ProductsStore.getPrintTabLink(null, data.id)}
                  target="_blank"
                  title={T('print-tags')}
                >
                  <FontAwesomeIcon
                    icon="tags"
                    size="1x"
                    title={T('print-tags')}
                  />
                </Link>
              </Level.Item>
            </Level.Side>
          </Level>
        </td>
        <td> {T(data['shipment_status'])}</td>
        <td className="left">
          <b>
            {data['shipment_status'] === 'complete'
              ? T('expected')
              : T('supply')}
            :
          </b>{' '}
          {data['expected_quantity']} <br />
          <b>{T('received')}:</b> {data['quantity']} <br />
          <span className="has-text-success">
            <b>{T('saled')}:</b> {data['sold']} (
            {data['sold'] > 0
              ? Math.round((100 / data['quantity']) * data['sold'])
              : 0}
            %) <br />
          </span>
        </td>
        <td className="left">
          {!User.getPermissionEnable('incomeinformation') ? null : (
            <>
              {this.getPaymentInfo(data)} <br />
            </>
          )}
        </td>
      </tr>
    );
  }

  render() {
    return isMobile ? this.mobileRender() : this.desktopRender();
  }
}

export default ShipmentsRow;
